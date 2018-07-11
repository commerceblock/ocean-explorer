var rpcApi = require("../controllers/rpc")
   , Block = require("../models/block")
   , Tx = require("../models/tx")
   , Info = require("../models/info")

async function save_block(block) {
    try {
        newblock = await block.save();
        console.log("Block " + block.height + " saved.");
    } catch(err) {
        console.error(err);
    }
}

async function new_block(blockhash, height, blockdata) {
    try {
        block = await Block.findOne({hash: blockhash});
        if (block) {
            return;
        }
        var newblock = new Block({
            hash: blockhash,
            height: height,
            rpcdata: blockdata
        });
        await save_block(newblock);
    } catch(err) {
        console.error(err);
    }
}

async function save_tx(tx) {
    try {
        newtx = await tx.save();
        console.log("Tx " + tx.txid + " saved.");
    } catch(err) {
        console.error(err);
    }
}

async function new_tx(txid, txdata, blockheight, blockhash) {
    try {
        tx = await Tx.findOne({txid: txid});
        if (tx) {
            return;
        }
        var newtx = new Tx({
            txid: txid,
            rpcdata: txdata,
            blockheight: blockheight,
            blockhash: blockhash
        });
        await save_tx(newtx);
    } catch(err) {
        console.error(err);
    }
}

module.exports = {
    get_blockchain_info: function(cb) {
        Info.findOne(function(error, info) {
            if(info) {
                return cb(info, error);
            } else {
                return cb(null, error);
            }
        });
    },
    update_blockchain_info: function(cb) {
        rpcApi.getBlockchainInfo().then(function(getblockchaininfo) {
            rpcApi.getNetworkInfo().then(function(getnetworkinfo) {
                rpcApi.getNetTotals().then(function(getnettotals) {
                    var newinfo = {
                        chain: getblockchaininfo.chain,
                        blockchaininfo: getblockchaininfo,
                        networkinfo: getnetworkinfo,
                        nettotals: getnettotals
                    };

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
    },
    update_blockchain_data: async function(firstHeight, lastHeight, cb) {
        for (var height=firstHeight; height<=lastHeight; height++) {
            try {
                blockhash = await rpcApi.getBlockHash(height);
                result = await rpcApi.getBlockData(client, blockhash, 20, 0);

                await new_block(blockhash, height, result.getblock);

                for (var i = 0; i < result.transactions.length; i++) {
                    await new_tx(result.transactions[i]["txid"], result.transactions[i], height, blockhash);
                }

            } catch (error) {
                console.log("Failed to load data");
                return cb(error)
            }
        }
        return cb(null)
    },
}
