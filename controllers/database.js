/*
 * @database.js Main database controller
 * Functionality to write blockchain info and block/tx data to database
 * Functionality to read info/data using index lookup and $in queries
 *
 * @author Nikolaos Kostoulas 2018
 *
 */

var rpcApi = require("../controllers/rpc")
  , Block = require("../models/block")
  , Tx = require("../models/tx")
  , Info = require("../models/info")
  , env = require("../helpers/env")
  , bitcoin = require("bitcoin-core");

// Save new block using the Block model
async function save_block(block) {
    try {
        newblock = await block.save();
        console.log("Block " + block.height + " saved.");
    } catch(err) {
        console.error(err);
    }
}

// Create new block using the Block model and call save method
async function new_block(blockhash, height, blockdata) {
    try {
        block = await Block.findOne({hash: blockhash}); // check first if block exists
        if (block) {
            return;
        }
        var newblock = new Block({
            hash: blockhash,
            height: height,
            getblock: blockdata
        });
        await save_block(newblock);
    } catch(err) {
        console.error(err);
    }
}

// Save new tx using the Tx model
async function save_tx(tx) {
    try {
        newtx = await tx.save();
        console.log("Tx " + tx.txid + " saved.");
    } catch(err) {
        console.error(err);
    }
}

// Create new tx using the Tx model and call save method
async function new_tx(txid, txdata, blockheight, blockhash) {
    try {
        tx = await Tx.findOne({txid: txid}); // check first if tx exists
        if (tx) {
            return;
        }
        var newtx = new Tx({
            txid: txid,
            getrawtransaction: txdata,
            blockheight: blockheight,
            blockhash: blockhash
        });
        await save_tx(newtx);
    } catch(err) {
        console.error(err);
    }
}

module.exports = {
    // Get tx from Tx collection using txid
    get_tx: function(txid, cb) {
        return new Promise(function(resolve, reject) {
            Tx.findOne({txid: txid}, function(error, tx) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(tx);
            });
        });
    },
    // Get multiple txes from Tx collection by doing multiple txid lookups
    get_txes: function(txids, cb) {
        return new Promise(function(resolve, reject) {
            var promises = [];
            for (const txid of txids) {
                promises.push(module.exports.get_tx(txid));
            }
            Promise.all(promises).then(function() {
                var results = arguments[0];
                var txes = [];
                for (var i = 0; i < results.length; i++) {
                    txes.push(results[i]);
                }
                resolve(txes);
            }).catch(function(error) {
                reject(error);
            });
        });
    },
    // Get block from Block collection using block height
    get_block_height: function(blockheight, cb) {
        return new Promise(function(resolve, reject) {
            Block.findOne({height: blockheight}, function(error, block) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(block);
            });
        });
    },
    // Get block from Block collection using block hash
    get_block_hash: function(blockhash, cb) {
        return new Promise(function(resolve, reject) {
            Block.findOne({hash: blockhash}, function(error, block) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(block);
            });
        });
    },
    // Get multiple blocks from Block collection by looking up a list of block heights
    get_blocks_height: function(blockheights, cb) {
        return new Promise(function(resolve, reject) {
            Block.find({height: { $in: blockheights}}, function(error, blocks) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(blocks);
            });
        });
    },
    // Get blockchain info from Info collection - Info collection should only have 1 entry
    get_blockchain_info: function(cb) {
        return new Promise(function(resolve, reject) {
            Info.findOne(function(error, info) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(info);
            });
        });
    },
    // Update blockchain info in the Info collection by doing multiple rpc calls to client chain
    update_blockchain_info: function(cb) {
        // establish rpc connection to client
        client = new bitcoin({
            host: env.ocean.host,
            port: env.ocean.port,
            username: env.ocean.rpc.username,
            password: env.ocean.rpc.password,
        });
        // chain multiple rpc calls to receive blockchain info required
        rpcApi.getBlockchainInfo().then(function(getblockchaininfo) {
            rpcApi.getNetworkInfo().then(function(getnetworkinfo) {
                rpcApi.getNetTotals().then(function(getnettotals) {
                    rpcApi.getMempoolInfo().then(function(getmempoolinfo) {
                        rpcApi.getMempoolStats().then(function(getmempoolstats) {
                            var newinfo = {
                                chain: getblockchaininfo.chain,
                                blockchaininfo: getblockchaininfo,
                                networkinfo: getnetworkinfo,
                                nettotals: getnettotals,
                                mempoolinfo: getmempoolinfo,
                                mempoolstats: getmempoolstats
                            };
                            // update info - should be one entry only
                            // if info does not exist - create
                            Info.findOneAndUpdate({chain: getblockchaininfo.chain}, newinfo, {upsert : true, new: true}, function(err, infoentry){
                                if (err) {
                                    return cb(null, err);
                                } else {
                                    return cb(infoentry, null);
                                }
                            });
                        }).catch(function(err) {
                            return cb(null, err);
                        });
                    }).catch(function(err) {
                        return cb(null, err);
                    });
                }).catch(function(err) {
                    return cb(null, err);
                });
            }).catch(function(err) {
                return cb(null, err);
            });
        }).catch(function(err) {
            return cb(null, err);
        });
    },
    // Update blockchain data in the Tx and Block collections by doing multiple rpc calls to client chain
    update_blockchain_data: async function(firstHeight, lastHeight, cb) {
        for (var height=firstHeight; height<=lastHeight; height++) {
            try {
                // establish rpc connection to client
                client = new bitcoin({
                    host: env.ocean.host,
                    port: env.ocean.port,
                    username: env.ocean.rpc.username,
                    password: env.ocean.rpc.password,
                });
                // Get block and save
                blockhash = await rpcApi.getBlockHash(height);
                result = await rpcApi.getBlockData(client, blockhash);
                await new_block(blockhash, height, result.getblock);

                // Get block transactions and save
                for (var i = 0; i < result.transactions.length; i++) {
                    await new_tx(result.transactions[i]["txid"], result.transactions[i], height, blockhash);
                }
            } catch (error) {
                console.log("Failed to store block data");
                return cb(error)
            }
        }
        return cb(null)
    },
}
