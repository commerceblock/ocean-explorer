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
var rpcApi = require("./controllers/rpc.js");
var momentDurationFormat = require("moment-duration-format");
var baseActionsRouter = require('./routes/router');
var serveStatic = require('serve-static')
var mongoose = require('mongoose')

var app = express();
var genesisAssetHex = "f1c270c6ca139803d8556a2463b23be1c2170e69c5d3ae55e381b9c7e490938f";
var genesisAsset = "CBT";

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

// connect to MongDB - should automatically try to reconnect if connection fails
mongoose.connect(dbConnect, { useNewUrlParser: true }, function(err) {
    if (err) {
      console.log('Unable to connect to database: %s', dbConnect);
      exit();
    }
});

mongoose.Promise = Promise

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback) {
    console.log("Connection succeeded.");
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
                  path: '/bestblockheight/',
                  method: 'GET'}, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            var parsedResponse
            try {
                parsedResponse = JSON.parse(chunk)
                global.attestedheight = parsedResponse["blockheight"]
            } catch(err) {
                console.log("ERROR ATTESTATION_API: Failed parsing http response")
            }
        });
    }).on('error', function(err) {
        console.log("Error ATTESTATION_API: Request Failed")
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

app.locals.moment = moment;
app.locals.Decimal = Decimal;
app.locals.utils = utils;

app.locals.genesisAsset = genesisAsset;
app.locals.assets = {};

// Currently include testnet assets - Should be configured appropriately for any mainnet issuance
app.locals.assets[genesisAssetHex] =  genesisAsset; // for 3-of-5 testnet
app.locals.assets["f1c270c6ca139803d8556a2463b23be1c2170e69c5d3ae55e381b9c7e490938f"] = genesisAsset; // for 2-of-3 local
global.dummy_assets = ['BTC', 'ETH', 'XRP', 'BCH', 'EOS', 'LTC', 'XLM', 'ADA', 'TRX',
                        'MIOTA', 'GOLD', 'SILVER', 'GAS', 'OIL', 'COPPER', 'PLATINUM'];

module.exports = app;
