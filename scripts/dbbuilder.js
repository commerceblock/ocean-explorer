/*
 * @dbbuilder.js Build blockchain database script
 * @author Nikolaos Kostoulas 2018
 */
var mongoose = require('mongoose')
  , env = require("../helpers/env.js")
  , bitcoin = require("bitcoin-core")
  , rpcApi = require("../controllers/rpc")
  , Block = require("../models/block")
  , Tx = require("../models/tx")
  , Info = require("../models/info")
  , dbApi = require("../controllers/database");

// dbbuilder.js usage
function usage() {
    console.log('Usage: node scripts/dbbuilder.js [mode]');
    console.log('');
    console.log('[mode]:');
    console.log('init      Clear indexes and rebuild database starting from genesis block');
    console.log('update    Update database from the last build to the latest chain block');
    console.log('check     Check database and add transactions/blocks that are missing');
    console.log('');
    process.exit(0);
}

var mode = 'check'
if (process.argv.length < 2) {
    usage();
} else {
    switch(process.argv[2])
    {
        case 'update':
          mode = 'update';
          break;
        case 'check':
          mode = 'check';
          break;
        case 'init':
          mode = 'init';
          break;
        default:
          usage();
    }
}

// Db connection details
var dbConnect = 'mongodb://';
if (env.dbsettings.user && env.dbsettings.password) {
    dbConnect += env.dbsettings.user + ':' + env.dbsettings.password
}
dbConnect = dbConnect + '@' + env.dbsettings.address;
dbConnect = dbConnect + ':' + env.dbsettings.port;
dbConnect = dbConnect + '/' + env.dbsettings.database;

mongoose.connect(dbConnect, { useNewUrlParser: true }, function(err) {
    if (err) {
      console.log('Unable to connect to database: %s', dbConnect);
      exit();
    }

    client = new bitcoin({
        host: env.ocean.host,
        port: env.ocean.port,
        username: env.ocean.rpc.username,
        password: env.ocean.rpc.password,
    });

    doWork(client);
});

mongoose.Promise = Promise

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback) {
    console.log("Connection succeeded.");
});

function doWork(client) {
    dbApi.get_blockchain_info().then(function(prevInfo) {
        dbApi.update_blockchain_info(function(info, error) {
            if (error) {
                console.error(error);
                process.exit(0);
            }

            if (mode == 'init') {
                Tx.remove({}, function(errTx) {
                    Block.remove({}, function(errBlock) {
                        dbApi.update_blockchain_data(0, info.blockchaininfo.blocks, function(error) { // from start to latest height
                            if (error) {
                                process.exit(0);
                            } else {
                                console.log("Finished " + mode);
                                process.exit(0);
                            }
                        });
                    })
                })
            } else if (mode == 'check') {
                dbApi.update_blockchain_data(0, info.blockchaininfo.blocks, function(error) { // from start to latest height
                    if (error) {
                        process.exit(0);
                    } else {
                        console.log("Finished " + mode);
                        process.exit(0);
                    }
                });
            } else if (mode == 'update') {
                var prevHeight = 0
                if (prevInfo) {
                    prevHeight = prevInfo.blockchaininfo.blocks
                }
                console.log("Update starting at height " + prevHeight);
                dbApi.update_blockchain_data(prevHeight, info.blockchaininfo.blocks, function(error) { // from prev height to latest height
                    if (error) {
                        process.exit(0);
                    } else {
                        console.log("Finished " + mode);
                        process.exit(0);
                    }
                });
            }
        });
    }).catch(function(error) {
        if (error) {
            console.error(error)
            process.exit(0);
        }
    });
}
