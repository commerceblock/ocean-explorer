#!/usr/bin/env node

'use strict';

var express = require('express');
var http = require('http')
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var env = require("./helpers/env.js");
var utils = require("./helpers/utils.js");
var moment = require("moment");
var Decimal = require('decimal.js');
var bitcoin = require("bitcoin-core");
var pug = require("pug");
var dbApi = require("./controllers/database");
var momentDurationFormat = require("moment-duration-format");
var baseActionsRouter = require('./routes/router');
var serveStatic = require('serve-static')
var mongoose = require('mongoose')

var app = express();

// set app locals
app.locals.moment = moment;
app.locals.Decimal = Decimal;
app.locals.utils = utils;

var genesisAsset = env.genesisAsset;
app.locals.genesisAsset = genesisAsset;
app.locals.assets = {};

// Currently include testnet assets - Should be configured appropriately for any mainnet issuance
app.locals.assets["cad5765e6f54ceb51c0366e4e349e5fbbfabcefadecf8fc3b614514784c0c2f2"] =  genesisAsset; // for 3-of-5 testnet

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// ref: https://blog.stigok.com/post/disable-pug-debug-output-with-expressjs-web-app
app.engine('pug', (path, options, fn) => {
  options.debug = false;
  return pug.__express.call(null, path, options, fn);
});

app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(serveStatic(path.join(__dirname, 'public')))

// connect to mongo db database using mongoose
var dbConnect = 'mongodb://';
if (env.dbsettings.user && env.dbsettings.password) {
    dbConnect += env.dbsettings.user + ':' + env.dbsettings.password
}
dbConnect = dbConnect + '@' + env.dbsettings.address;
dbConnect = dbConnect + ':' + env.dbsettings.port;
dbConnect = dbConnect + '/' + env.dbsettings.database;

mongoose.Promise = Promise

var db = mongoose.connection;
db.on("error", function(err) {
    console.error(err);
    process.exit(0);
});
db.once("open", function(callback) {
    console.log("Connection succeeded.");

    // get genesis asset hash
    dbApi.get_block_height(0).then(function(blockByHeight) {
        if (blockByHeight && blockByHeight.getblock.tx.length > 1) {
            dbApi.get_tx(blockByHeight.getblock.tx[1]).then(function(tx) {
                if (tx && tx.getrawtransaction.vin[0].issuance) {
                    app.locals.assets[tx.getrawtransaction.vin[0].issuance.asset] = genesisAsset; // add asset hex as genesis asset
                }
            }).catch(function(err) {
                console.log("genesis issuance tx missing")
            });
        }
    }).catch(function(err) {
        console.log("genesis block missing")
    });
});

// connect to MongDB - should automatically try to reconnect if connection fails
mongoose.connect(dbConnect, {
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: 1000 ,
        useNewUrlParser: true
    }, function(err) {
    if (err) {
        console.log('Unable to connect to database: %s', dbConnect);
        process.exit(0);
    }
});

app.use(function(req, res, next) {
	if (env.ocean && env.ocean.rpc) {
		res.locals.host = env.ocean.host;
		res.locals.port  = env.ocean.port;
		res.locals.username = env.ocean.rpc.username;

		global.client = new bitcoin({
	  		host: env.ocean.host,
	  		port: env.ocean.port,
	  		username: env.ocean.rpc.username,
	  		password: env.ocean.rpc.password,
	  		timeout: 5000
	    });
	}
	res.locals.env = env;

    // get latest block height by sending a GET request to the attestation API
    http.request({host: env.attestation.host,
                  port: env.attestation.port,
                  path: '/api/v1/latestcommitment?position=' + env.attestation.position,
                  method: 'GET'}, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            var parsedResponse
            try {
                parsedResponse = JSON.parse(chunk)
                global.attestedhash = parsedResponse["response"]["commitment"]
                dbApi.get_block_hash(attestedhash).then(function(blockByHash) {
                    if (blockByHash) {
                        global.attestedheight = blockByHash.height
                    }
                }).catch(function(err) {
                    console.log("ERROR ATTESTATION_API: Failed getting block for commitment")
                });
            } catch(err) {
                console.log("ERROR ATTESTATION_API: Failed parsing http response")
            }
        });
    }).on('error', function(err) {
        console.log("Error ATTESTATION_API: Request Failed: " + err)
    }).end();

	next();
});

app.use('/', baseActionsRouter);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: "Internal Server Error",
		error: {}
	});
});

module.exports = app;
