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
  , Asset = require("../models/asset")
  , Addr = require("../models/addr")
  , Info = require("../models/info")
  , env = require("../helpers/env")
  , bitcoin = require("bitcoin-core");

// Save new block using the Block model
async function save_block(block) {
    newblock = await block.save();
    console.log("Block " + newblock.height + " saved.");
    return newblock;
}

// Create new block using the Block model and call save method
async function new_block(blockhash, height, blockdata) {
    block = await Block.findOne({hash: blockhash}); // check first if block exists
    if (block) {
        return block;
    }
    var newblock = new Block({
        hash: blockhash,
        height: height,
        getblock: blockdata
    });
    return await save_block(newblock);
}

// Save new tx using the Tx model
async function save_tx(tx) {
    newtx = await tx.save();
    console.log("Tx " + newtx.txid + " saved.");
    return newtx;
}

// Create new tx using the Tx model and call save method
async function new_tx(txid, txdata, blockheight, blockhash) {
    tx = await Tx.findOne({txid: txid}); // check first if tx exists
    if (tx) {
        return tx;
    }
    var newtx = new Tx({
        txid: txid,
        getrawtransaction: txdata,
        blockheight: blockheight,
        blockhash: blockhash
    });
    return await save_tx(newtx);
}

// Save new asset using the Asset model
async function save_asset(asset) {
    newasset = await asset.save();
    console.log("Asset " + newasset.asset + " saved.");
    return newasset;
}

// Create new asset using the Asset model and call save method,
// or add reissuance amount to existing asset
async function new_asset(asset, assetamount, assetlabel, token, tokenamount, issuancetxid, isreissuance, destroy=false) {
    if (!isreissuance && !destroy) {
        existing_asset = await Asset.findOne({asset: asset}); // check first if asset exists
        if (existing_asset) {
            return existing_asset;
        }
        var newasset = new Asset({
            asset: asset,
            assetamount: assetamount,
            assetlabel: assetlabel,
            token: token,
            tokenamount: tokenamount,
            issuancetx: issuancetxid
        });
        return await save_asset(newasset);
    }
    if (destroy) {
        existing_asset = await Asset.findOneAndUpdate({"asset":asset},{$inc:{"assetamount":-assetamount,"destroyedamount":assetamount}});
        console.log("Asset " + asset + " destroy recorded.")
    } else {
        // Must be reissuance -> Update existing asset's assetamount
        existing_asset = await Asset.findOneAndUpdate({"asset":asset},{$inc:{"assetamount":assetamount,"reissuedamount":assetamount}});
        console.log("Asset " + asset + " reissuance recorded.")
    }
    if (!existing_asset)
        throw("Failed to find asset "+asset+" for reissuance/destruction.");
    return existing_asset
}



// Save new addr using the Address model
async function save_addr(addrs) {
    for (const addr of addrs) {
        newaddr = await addr.save();
    }
    console.log("Tx " + newaddr.txid + " vout adderesses saved.");
    return newaddr;
}

// Create new address using the Addr model and call save method
async function new_addr(vin, vout) {
    // Set vin's isSpent=true
    if (vin.length) {
        for (const inp of vin) {
            update_inp = await Addr.findOneAndUpdate({"txid":inp["txid"],"vout":inp["vout"]},{$set:{"isSpent":true}});
            if (update_inp)
                console.log("Tx vout " + inp.vout + " of txid " + inp.txid + " marked as spent.")
        }
    }
    // Save vout's
    if (vout.length) {
        newaddrs = []
        for (const outp of vout) {
            // Check if addr entry exists
            addr = await Addr.findOne({"txid":vout["txid"],"vout":vout["vout"]});
            if (addr)
                continue;
            var newaddr = new Addr({
                address: outp["address"][0],
                txid:    outp["txid"],
                vout:    outp["vout"]
            });
            newaddrs.push(newaddr)
        }
        return await save_addr(newaddrs);
    }
    return
}

// Save new info using the Info model
async function save_info(info) {
    // update info - should be one entry only
    // if info does not exist - create
    newinfo = await Info.findOneAndUpdate({chain: info.blockchaininfo.chain}, info, {upsert : true, new: true});
    console.log("Info for height " + newinfo.blockchaininfo.blocks + " saved.");
    return newinfo;
}

// Create new info entry using the Info model and call save method
async function new_info(height, blockchaininfo, networkinfo, nettotals, mempoolinfo, mempoolstats) {
    var newinfo = {
        latestStoredHeight: height,
        chain: blockchaininfo.chain,
        blockchaininfo: blockchaininfo,
        networkinfo: networkinfo,
        nettotals: nettotals,
        mempoolinfo: mempoolinfo,
        mempoolstats: mempoolstats
    };

    return await save_info(newinfo);
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
    // Get block with the largest block height in the Block collection
    get_latest_block: function(cb) {
        return new Promise(function(resolve, reject) {
            Block.findOne().sort('-height').exec(function(error, block) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(block);
            })
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
    get_blocks_height: function(blockheights, sortOrder='desc', cb) {
        return new Promise(function(resolve, reject) {
            Block.find({height: { $in: blockheights}}).sort({height: sortOrder}).exec(function(error, blocks) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(blocks);
            });
        });
    },
    // Get asset from Assets collection using assetid
    get_asset: function(assetid, cb) {
        return new Promise(function(resolve, reject) {
            Asset.findOne({asset: assetid}, function(error, asset) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(asset);
            });
        });
    },
    // Get all assets from Assets collection
    get_all_assets: function(cb) {
        return new Promise(function(resolve, reject) {
            Asset.find({}, function(error, assets) {
              if (error) {
                  reject(error);
                  return;
              }
              resolve(assets);
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
    update_blockchain_info: async function(height, cb) {
        try {
            // establish rpc connection to client
            client = new bitcoin({
                host: env.ocean.host,
                port: env.ocean.port,
                username: env.ocean.rpc.username,
                password: env.ocean.rpc.password,
            });

            // await multiple rpc calls to receive blockchain info required
            var getblockchaininfo = await rpcApi.getBlockchainInfo();
            var getnetworkinfo = await rpcApi.getNetworkInfo();
            var getnettotals = await rpcApi.getNetTotals();
            var getmempoolinfo = await rpcApi.getMempoolInfo();
            var getmempoolstats = await rpcApi.getMempoolStats();
        } catch (rpcError) {
            console.log("Failed to get blockchain info data");
            return cb(rpcError);
        }

        try {
            // try and find previous info entry
            // if previous info blockcount is larger, assume syncing node is out of date and throw
            prevInfoEntry = await Info.findOne({chain: getblockchaininfo.chain});
            if (prevInfoEntry) {
                if (prevInfoEntry.blockchaininfo.blocks > getblockchaininfo.blocks) {
                    throw new Error("Node height " + getblockchaininfo.blocks +
                        " out of date. Latest height " + prevInfoEntry.blockchaininfo.blocks)
                }
            }

            // update or generate new info entry
            newInfoEntry = await new_info(height, getblockchaininfo, getnetworkinfo, getnettotals, getmempoolinfo, getmempoolstats);
        } catch (dbError) {
            console.log("Failed to store blockchain info data");
            return cb(dbError);
        }
        return cb(null);
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

                blockhash = await rpcApi.getBlockHash(height);
                result = await rpcApi.getBlockData(client, blockhash);
            } catch (rpcError) {
                console.log("Failed to get block/transcation data");
                return cb(rpcError);
            }

            try{
                // Get block and save
                await new_block(blockhash, height, result.getblock);
                // Get block transactions
                for (var i = 0; i < result.transactions.length; i++) {
                    // Check for asset issuance/reissuance
                    if (result.transactions[i]["vin"][0]["issuance"] != undefined) {
                        await new_asset(
                          result.transactions[i]["vin"][0]["issuance"]["asset"],
                          result.transactions[i]["vin"][0]["issuance"]["assetamount"],
                          result.transactions[i]["vin"][0]["issuance"]["assetlabel"],
                          result.transactions[i]["vin"][0]["issuance"]["token"],
                          result.transactions[i]["vin"][0]["issuance"]["tokenamount"],
                          result.transactions[i]["txid"],
                          result.transactions[i]["vin"][0]["issuance"]["isreissuance"]
                        )
                    }
                    // Check for asset destroy transaction -> if OP_RETURN vout exists && vout has non-zero vlaue
                    vout_OP_RET = result.transactions[i]["vout"].find(item => item["scriptPubKey"]["asm"] == "OP_RETURN")
                    if (vout_OP_RET != null && vout_OP_RET["value"] > 0) {
                        await new_asset(vout_OP_RET["asset"],vout_OP_RET["value"],"","","","","",true)
                    }
                    // Save Txs
                    await new_tx(result.transactions[i]["txid"], result.transactions[i], height, blockhash);
                    // Save Address
                    // Get txid and vout of input txs that are not coinbase
                    vin = result.transactions[i]["vin"].filter(item => item["coinbase"] == undefined)
                        .map(item => {return({txid:item["txid"],vout:item["vout"]})});
                    // Get addresses, txid and vin of txs
                    vout = result.transactions[i]["vout"].map(item => {return({
                        address:item["scriptPubKey"]["addresses"] ? item["scriptPubKey"]["addresses"] : "",
                        txid:result.transactions[i]["txid"],
                        vout:item["n"]
                    })});
                    await new_addr(vin,vout)
                }

                // Get blockchain info and save
                await module.exports.update_blockchain_info(height, function(infoError) {
                    if (infoError) {
                        cb(infoError);
                    }
                });

            } catch (dbError) {
                console.log("Failed to store block/transaction data");
                cb(dbError);
            }
        }
        return cb(null);
    },
}
