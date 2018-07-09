var mongoose = require('mongoose')
  , env = require("../app/env.js")
  , bitcoin = require("bitcoin-core")
  , rpcApi = require("../app/rpcApi")
  , Block = require("../models/block")
  , Tx = require("../models/tx");

client = new bitcoin({
    host: env.ocean.host,
    port: env.ocean.port,
    username: env.ocean.rpc.username,
    password: env.ocean.rpc.password,
    timeout: 5000
});

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
});

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback) {
    console.log("Connection succeeded.");
});

var height = 0

rpcApi.getBlockHash(height).then(function(blockhash) {
    rpcApi.getBlockData(client, blockhash, 20, 0).then(function(result) {
        var block = new Block({
            hash: blockhash,
            height: height,
            rpcdata: result.getblock
        });
        block.save(function(error) {
            if (error) {
                console.error(error)
            } else {
                console.log("Block saved")
            }
        })

        for (var i = 0; i < result.transactions.length; i++) {
            var tx = new Tx({
                txid: result.transactions[i]["txid"],
                rpcdata: result.transactions[i]
            })
            tx.save(function(error) {
                if (error) {
                console.error(error)
                } else {
                    console.log("Tx saved")
                }
            })
        }
    }).catch(function(err) {
        console.log("Failed to load block");
    });
}).catch(function(err) {
    console.log("Failed to load block");
});
