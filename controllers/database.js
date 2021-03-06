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
  , Balance = require("../models/balance")
  , AddrTx = require("../models/addrtx")
  , Info = require("../models/info")
  , Pegout = require("../models/pegout")
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

// Save new pegout using the Pegout model
async function save_pegout(pegout) {
    newpegout = await pegout.save();
    console.log("Pegout " + pegout.txid + " saved.");
    return newpegout;
}

// Create new pegout using the Pegout model and call save method
async function new_pegout(txid, out) {
    pegout = await Pegout.findOne({txid: txid}); // check first if pegout exists
    if (pegout) {
        return pegout;
    }
    var newpegout = new Pegout({
        txid: txid,
        address: out["scriptPubKey"]["pegout_hex"],
        amount: out["value"],
        isPaid: false
    });
    return await save_pegout(newpegout);
}

// Save new asset using the Asset model
async function save_asset(asset) {
    newasset = await asset.save();
    console.log("Asset " + newasset.asset + " saved.");
    return newasset;
}

// Create new asset using the Asset model and call save method,
// or add reissuance amount to existing asset
async function new_asset(asset, offset, assetamount, assetlabel, token, tokenamount, issuancetxid, isreissuance, destroy=false) {
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
            issuancetx: issuancetxid,
            offset: offset
        });
        return await save_asset(newasset);
    }
    if (destroy) {
        existing_asset = await Asset.findOne({"asset":asset});
        if (!existing_asset) {
            throw("Failed to find asset "+asset+" for destruction.");
        }
        if (existing_asset.offset >= offset) {
            console.log("Asset " + asset + " already destroyed.");
            return existing_asset;
        }
        existing_asset.assetamount -= assetamount;
        existing_asset.destroyedamount += assetamount;
        existing_asset.offset = offset;
        await existing_asset.save();
        console.log("Asset " + asset + " destroy recorded.")
    } else {
        existing_asset = await Asset.findOne({"asset":asset});
        if (!existing_asset) {
            throw("Failed to find asset "+asset+" for reissuance.");
        }
        if (existing_asset.offset >= offset) {
            console.log("Asset " + asset + " already reissued.");
            return existing_asset;
        }
        existing_asset.assetamount += assetamount;
        existing_asset.reissuedamount += assetamount;
        existing_asset.offset = offset;
        await existing_asset.save();
        console.log("Asset " + asset + " reissuance recorded.")
    }
    return existing_asset
}

// Process new peg-in using the Asset model and call save method
async function new_pegin(asset, offset, assetamount) {
    console.log("New pegin for " + assetamount + " amount.")
    existing_asset = await Asset.findOne({asset: asset}); // check first if asset exists
    if (!existing_asset) {
        var newasset = new Asset({
            asset: asset,
            assetamount: assetamount,
            assetlabel: "CBT",
            token: "",
            issuancetx: "",
            offset: offset
        });
        return await save_asset(newasset);
    }
    if (existing_asset.offset >= offset) {
        console.log("Pegin already recorded.");
        return existing_asset;
    }
    existing_asset.assetamount += assetamount;
    existing_asset.offset = offset;
    return await save_asset(existing_asset);
}

// Save new addr using the AddressTx model
async function save_addrtx(addrs) {
    if (addrs.length == 0)
        return
    for (const addr of addrs) {
        newaddr = await addr.save();
    }
    console.log("Tx " + newaddr.txid + " vout addresses saved.");
    return newaddr;
}

// Create new address using the AddrTx model and call save method
async function new_addrtx(vin, vout, txid, offset) {
    var addrMap = {}
    // Set vin's spent true
    if (vin.length) {
        for (const inp of vin) {
            // find unspent and update
            // for issuances nothing happens
            updated = await AddrTx.findOne({"txid":inp["txid"],"vout":inp["vout"]});
            if (updated) {
                if (updated.spent == "") {
                    updated.spent = txid;
                    await updated.save();
                    console.log("Tx vout " + inp.vout + " of txid " + inp.txid + " marked as spent.");
                }
                if (updated.address in addrMap) {
                    if ("sp" in addrMap[updated.address])
                        addrMap[updated.address]["sp"].push(updated)
                    else
                        addrMap[updated.address]["sp"] = [updated]
                } else {
                    addrMap[updated.address] = {}
                    addrMap[updated.address]["sp"] = [updated]
                }
            }
        }
    }
    // Save vout's
    if (vout.length) {
        newaddrs = []
        for (const outp of vout) {                  // For each output
            for (const addr of outp["address"]) {   // For each address
                // Check if addr entry exists
                var addrtx = await AddrTx.findOne({"address":addr,"txid":outp["txid"],"vout":outp["vout"]});
                if (!addrtx) {
                    addrtx = new AddrTx({
                        address: addr,
                        txid:    outp["txid"],
                        vout:    outp["vout"],
                        value:   outp["value"],
                        asset:   outp["asset"],
                        assetlabel: outp["assetlabel"],
                        istoken: outp["istoken"],
                    });
                    newaddrs.push(addrtx);
                }
                if (addrtx.address in addrMap) {
                    if ("unsp" in addrMap[addrtx.address])
                        addrMap[addrtx.address]["unsp"].push(addrtx)
                    else
                        addrMap[addrtx.address]["unsp"] = [addrtx]
                } else {
                    addrMap[addrtx.address] = {}
                    addrMap[addrtx.address]["unsp"] = [addrtx]
                }
            }
        }
        await save_addrtx(newaddrs);
    }
    await update_balance(addrMap, offset);
}

// Update address balances in one go for a single transaction
async function update_balance(addrMap, offset) {
    for (addr in addrMap) {
        balance = await Balance.findOne({"address": addr});
        if (!balance && "unsp" in addrMap[addr]) {
            var unspentAssets = {}
            unspent_val = 0;
            for (const unspent of addrMap[addr]["unsp"]) {
                val = Math.round(unspent.value * (10**8))
                if ((unspent.assetlabel == "" || unspent.assetlabel =="CBT") && !unspent.istoken)
                    unspent_val += val
                if (unspent.asset in unspentAssets)
                    unspentAssets[unspent.asset] += val;
                else
                    unspentAssets[unspent.asset] = val;
            }
            var newbalance = new Balance({address: addr,received: unspent_val,unspent: unspent_val,assets: unspentAssets,offset: offset});
            await newbalance.save();
        } else {
            if (balance.offset >= offset) {
                console.log(addr + " Balance already updated.");
                continue;
            }
            if ("sp" in addrMap[addr]) {
                for (const spent of addrMap[addr]["sp"]) {
                    spent_val = Math.round(spent.value * (10**8));
                    if ((spent.assetlabel == "" || spent.assetlabel == "CBT") && !spent.istoken)
                        balance.unspent -= spent_val;
                    balance.assets.set(spent.asset, balance.assets.get(spent.asset) - spent_val)
                }
            }
            if ("unsp" in addrMap[addr]) {
                for (const unspent of addrMap[addr]["unsp"]) {
                    unspent_val = Math.round(unspent.value * (10**8));
                    if ((unspent.assetlabel == "" || unspent.assetlabel == "CBT") && !unspent.istoken) {
                        balance.unspent += unspent_val;
                        balance.received += unspent_val;
                    }
                    asset_balance = balance.assets.get(unspent.asset);
                    if (asset_balance)
                        balance.assets.set(unspent.asset, asset_balance + unspent_val);
                    else
                        balance.assets.set(unspent.asset, unspent_val);
                }
            }
            balance.offset = offset;
            await balance.save();
            console.log(addr + " Balance updated.");
        }
    }
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
    // Get pegout from Pegouts collection using txid
    get_pegout: function(txid, cb) {
        return new Promise(function(resolve, reject) {
            Pegout.findOne({txid: txid}, function(error, pegout) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(pegout);
            });
        });
    },
    // Get all pegouts from Pegouts collection
    get_all_pegouts: function(unpaid=true, cb) {
        if (unpaid) {
            return new Promise(function(resolve, reject) {
              Pegout.find({"isPaid": false}, function(errorPegout, pegoutUnpaid) {
                  if (errorPegout) {
                      reject(errorPegout);
                      return;
                  }
                  resolve(pegoutUnpaid);
              });
            });
        }
        return new Promise(function(resolve, reject) {
            Pegout.find({}, function(errorPegout, pegout) {
                if (errorPegout) {
                    reject(errorPegout);
                    return;
                }
                resolve(pegout);
            });
        });
    },
    // Get asset from Assets collection using asset id
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
    // Get asset from Assets collection using token id
    get_asset_token: function(tokenid, cb) {
        return new Promise(function(resolve, reject) {
            Asset.findOne({token: tokenid}, function(error, asset) {
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
    // Get Balance for address from Balance collection
    get_address_balance: function(address, cb) {
        return new Promise(function(resolve, reject) {
            Balance.findOne({"address":address}).map(balance => {
              if (balance) {
                balance.received /= (10**8)
                balance.unspent /= (10**8)

                if (balance.assets) {
                  const balance_entries = balance.assets.entries()
                  let refined_balance_entries = []
                  for (const [asset, val] of balance_entries) {
                    if (val > 0) {
                      refined_balance_entries.push([asset, val / (10**8)])
                    }
                  }

                  balance.assets = new Map(refined_balance_entries.sort((a, b) => b[1] - a[1]))
                }
              }

              return balance
            }).exec(function(error, balance) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(balance);
            });
        });
    },
    get_balances: function(skip=0, limit=100, cb) {
      return new Promise(function(resolve, reject) {
          Balance.find({unspent: {$gt: 0}}, null, {skip, limit}).sort({unspent: 'desc'}).map(balances => {
              if (balances) {
                  for (let i = 0; i < balances.length; i++) {
                      transformBalance(balances[i])
                  }
              }

              return balances

              function transformBalance(balance) {
                balance.received /= (10**8)
                balance.unspent /= (10**8)

                if (!balance.assets) {
                  return
                }

                const balance_entries = balance.assets.entries()
                let refined_balance_entries = []
                for (const [asset, val] of balance_entries) {
                    if (val > 0) {
                        refined_balance_entries.push([asset, val / (10**8)])
                    }
                }

                balance.assets = new Map(refined_balance_entries.sort((a, b) => b[1] - a[1]))
              }
          }).exec(function(error, balances) {
              if (error) {
                  reject(error);
                  return;
              }
              resolve(balances);
          });
      });
    },
    get_balances_count: function() {
      return new Promise(function(resolve, reject) {
          Balance.countDocuments({unspent: {$gt: 0}}, function(error, count) {
              if (error) {
                  reject(error);
                  return;
              }
              resolve(count);
          });
      });
    },
    // Get Txs for address from AddrTx collection
    get_address_txs: function(address, utxo=false, skip=0, limit=100, cb) {
        if (utxo) {
          return new Promise(function(resolve, reject) {
              AddrTx.find({"address":address,"spent":""}, null, {skip: skip, limit: limit},
                function(errorAddress, addrUtxos) {
                  if (errorAddress) {
                      reject(errorAddress);
                      return;
                  }
                  resolve(addrUtxos);
              });
          });
        }
        return new Promise(function(resolve, reject) {
            AddrTx.find({"address":address}, null, {skip: skip, limit: limit},
                function(error, addrTxs) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(addrTxs);
            });
        });
    },
    // Get Txs count for address from AddrTx collection
    get_address_txs_count: function(address, utxo=false, cb) {
      let query = { address }
      if (utxo) {
        query.spent = ''
      }

      return new Promise(function(resolve, reject) {
          AddrTx.countDocuments(query, function(error, addrTxs) {
              if (error) {
                  reject(error);
                  return;
              }
              resolve(addrTxs);
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
    // Update blockchain info attestation information
    update_blockchain_info: function(info, cb) {
        return new Promise(function(resolve, reject) {
            save_info(info, function(error) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(true);
            });
        });
    },
    // Update blockchain info in the Info collection by doing multiple rpc calls to client chain
    update_blockchain_info_rpc: async function(height, cb) {
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
                    // Save Txs
                    tx = await new_tx(result.transactions[i]["txid"], result.transactions[i], height, blockhash);

                    // Check for asset issuance/reissuance
                    var token = "";
                    var issuance_asset = "";
                    if (result.transactions[i]["vin"][0]["issuance"] != undefined) {
                        token = result.transactions[i]["vin"][0]["issuance"]["isreissuance"] ?
                            "" : result.transactions[i]["vin"][0]["issuance"]["token"];
                        issuance_asset = result.transactions[i]["vin"][0]["issuance"]["asset"];
                        await new_asset(
                          result.transactions[i]["vin"][0]["issuance"]["asset"],
                          tx._id,
                          Math.round(result.transactions[i]["vin"][0]["issuance"]["assetamount"]*(10**8)),
                          result.transactions[i]["vin"][0]["issuance"]["assetlabel"],
                          result.transactions[i]["vin"][0]["issuance"]["token"],
                          Math.round(result.transactions[i]["vin"][0]["issuance"]["tokenamount"]*(10**8)),
                          result.transactions[i]["txid"],
                          result.transactions[i]["vin"][0]["issuance"]["isreissuance"]
                        )
                    }
                    // Check for peg-ins
                    if (result.transactions[i]["vin"][0]["is_pegin"] != undefined && result.transactions[i]["vin"][0]["is_pegin"]) {
                        // peg-in
                        if ("assetlabel" in result.transactions[i]["vout"][0] && result.transactions[i]["vout"][0]["assetlabel"] == "CBT") {
                            // peg-in fee
                            if ("assetlabel" in result.transactions[i]["vout"][1] && result.transactions[i]["vout"][1]["assetlabel"] == "CBT") {
                                await new_pegin(
                                    result.transactions[i]["vout"][0]["asset"],
                                    tx._id,
                                    Math.round(result.transactions[i]["vout"][0]["value"]*(10**8)
                                        + result.transactions[i]["vout"][1]["value"]*(10**8)));
                            } else {
                                await new_pegin(
                                    result.transactions[i]["vout"][0]["asset"],
                                    tx._id,
                                    Math.round(result.transactions[i]["vout"][0]["value"]*(10**8)));
                            }
                        }
                    }
                    // Check for asset destroy transaction -> if OP_RETURN vout exists && vout has non-zero vlaue
                    vout_OP_RET = result.transactions[i]["vout"].find(item => item["scriptPubKey"]["asm"].includes("OP_RETURN"))
                    if (vout_OP_RET != null && vout_OP_RET["value"] > 0) {
                        await new_asset(
                            vout_OP_RET["asset"],
                            tx._id,
                            Math.round(vout_OP_RET["value"]*(10**8)),"","","","","",true);

                        if ("pegout_hex" in vout_OP_RET["scriptPubKey"] && "assetlabel" in vout_OP_RET && vout_OP_RET["assetlabel"] == "CBT") {
                            await new_pegout(result.transactions[i]["txid"], vout_OP_RET);
                        }
                    }
                    // Save Address
                    // Get txid and vout of input txs that are not coinbase
                    vin = result.transactions[i]["vin"].filter(item => item["coinbase"] == undefined)
                        .map(item => {return({txid:item["txid"],vout:item["vout"]})});
                    // Get addresses, txid and vin of txs
                    vout = result.transactions[i]["vout"].filter(item => item["scriptPubKey"]["addresses"] != undefined)
                        .map(item => {return({
                            address: item["scriptPubKey"]["addresses"],
                            txid: result.transactions[i]["txid"],
                            vout: item["n"],
                            value: item["value"],
                            asset: item["asset"],
                            assetlabel: item["assetlabel"] ? item["assetlabel"] : "",
                            istoken: token == "" ? issuance_asset != "" && item["asset"] != issuance_asset : item["asset"] == token,
                    })});
                    await new_addrtx(vin,vout,result.transactions[i]["txid"],tx._id)
                }

                // Get blockchain info and save
                await module.exports.update_blockchain_info_rpc(height, function(infoError) {
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
