/*
 * @dbbuilder.js Build blockchain database script
 * Script used to build/update the database that stores
 * all the blockchain data on blocks and transactions
 * Can be run using different modes: init, check, update
 *
 * @author Nikolaos Kostoulas 2018
 *
 */

var mongoose = require('mongoose')
    , env = require("../helpers/env.js")
    , bitcoin = require("bitcoin-core")
    , rpcApi = require("../controllers/rpc")
    , Block = require("../models/block")
    , Tx = require("../models/tx")
    , Asset = require("../models/asset")
    , AddrTx = require("../models/addrtx")
    , Info = require("../models/info")
    , Balance = require("../models/balance")
    , dbApi = require("../controllers/database");

// dbbuilder.js usage
function usage() {
    console.log('Usage: node scripts/dbbuilder.js [mode]');
    console.log('');
    console.log('[mode]:');
    console.log('init clear Clear indexes and rebuild database starting from genesis block' )
    console.log('init       Continue rebuilding database from latest height in the database');
    console.log('update     Update database from the last build to the latest chain block');
    console.log('check      Check database and add transactions/blocks that are missing');
    console.log('');
    process.exit(0);
}

// dbbuilder.js mode options
var mode = 'update';
var clear = false;

if (process.argv.length < 3) {
    usage();
} else {
    switch(process.argv[2]) {
        case 'update':
            mode = 'update';
            break;
        case 'check':
            mode = 'check';
            break;
        case 'init':
            if (process.argv.length == 4) {
                if (process.argv[3] == 'clear') {
                    mode = 'init';
                    clear = true;
                } else {
                    usage();
                }
            } else {
                mode = 'init';
            }
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

// connect to db and start db builder main method
mongoose.connect(dbConnect, { useNewUrlParser: true }, function(err) {
    if (err) {
        console.error('Unable to connect to database: %s @ %s',
            env.dbsettings.user, dbConnect.split('@')[1]);
        console.error(err);
        process.exit(1);
    }
    doWork();
});

mongoose.Promise = Promise

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback) {
    console.log("Connection succeeded.");
});

// Main db builder method that updates db accordingly based on the script mode
function doWork() {
    dbApi.get_blockchain_info().then(function(prevInfo) { // previous info from db
        // establish rpc connection to client
        client = new bitcoin({
            host: env.ocean.host,
            port: env.ocean.port,
            username: env.ocean.rpc.username,
            password: env.ocean.rpc.password,
        });
        rpcApi.getBlockchainInfo().then(function(latestInfo) { // latest info from rpc
            if (mode == 'init') {
                if (clear)  { // Remove all documents and start from genesis block
                    console.log("Clearing database");
                    Info.remove({}, function(errInfo) {
                        Tx.remove({}, function(errTx) {
                            Block.remove({}, function(errBlock) {
                                Asset.remove({}, function(errAsset) {
                                    AddrTx.remove({}, function(errAddr) {
                                        Balance.remove({}, function(errBalance) {
                                            dbApi.update_blockchain_data(0, latestInfo.blocks, function(error) { // from start to latest height
                                                if (error) {
                                                    console.error(error);
                                                    process.exit(1);
                                                } else {
                                                    console.log("Finished " + mode);
                                                    process.exit(0);
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                } else { // Find latest block height stored and start from there
                    var prevHeight = 0;
                    dbApi.get_latest_block().then(function(latestBlock) {
                        if (latestBlock) {
                            prevHeight = latestBlock.getblock.height;
                            console.log("Starting init from latest block height " + prevHeight);
                        }
                        dbApi.update_blockchain_data(prevHeight, latestInfo.blocks, function(error) { // from prev height to latest height
                            if (error) {
                                console.error(error);
                                process.exit(1);
                            } else {
                                console.log("Finished " + mode);
                                process.exit(0);
                            }
                        });
                    }).catch(function(error) {
                        console.error(error);
                        process.exit(1);
                    });
                }
            } else if (mode == 'check') {
                dbApi.update_blockchain_data(0, latestInfo.blocks, function(error) { // from start to latest height
                    if (error) {
                        console.error(error);
                        process.exit(1);
                    } else {
                        console.log("Finished " + mode);
                        process.exit(0);
                    }
                });
            } else if (mode == 'update') {
                // get previous height from info before update
                var prevHeight = 0
                if (prevInfo && prevInfo.latestStoredHeight) {
                    prevHeight = prevInfo.latestStoredHeight;
                }
                console.log("Update starting at height " + prevHeight);
                dbApi.update_blockchain_data(prevHeight, latestInfo.blocks, function(error) { // from prev height to latest height
                    if (error) {
                        console.error(error);
                        process.exit(1);
                    } else {
                        console.log("Finished " + mode);
                        process.exit(0);
                    }
                });
            }
        }).catch(function(error) {
            if (error) {
                console.error(error);
                process.exit(1);
            }
        });
    }).catch(function(error) {
        if (error) {
            console.error(error);
            process.exit(1);
        }
    });
}
