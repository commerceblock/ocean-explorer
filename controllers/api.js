/*
 * @api.js Main Api controller
 * Functionality to handle http api requests via the router
 * Functionality to get information from database and return as JSON object
 *
 * @author Tomos Wootton 2019
 *
 */

var dbApi = require("../controllers/database");

// Function takes array of Addr collection entries and includes
// asset and value info from tx collection
function include_tx_data(addrTxes) {
    return new Promise(function(resolve, reject) {
        // Make promises for tx data of each tx
        txPromises = []
        addrTxes.forEach(function(addrTx) {
            txPromises.push(dbApi.get_tx(addrTx["txid"]))
        })
        Promise.all(txPromises).then(function(infoTxs) {   // wait for all promises to fullfuil
            newAddrTxes = addrTxes.map(addrTx => {
                // Find and include asset and value in addrTx
                infoTx = infoTxs.find(infoTx => infoTx["txid"] == addrTx["txid"])
                infoTxVout = infoTx["getrawtransaction"]["vout"].find(infoTxVout => infoTxVout["n"] == addrTx["vout"]);
                addrTx = addrTx.toObject()
                return({
                    ...addrTx,
                    asset:infoTxVout["asset"],
                    value:infoTxVout["value"]
                })
            });
            resolve(newAddrTxes)
        }).catch(function(errorPromises) {
            reject(errorPromises)
        });
    }).catch(function(errorFn) {
        reject(errorFn)
    })
}


module.exports = {
    // Get single block data from hash and dump JSON
    loadBlock: function(req, res, next) {
        try {
            if (req.params.block.length == 64) {
                dbApi.get_block_hash(req.params.block).then(function(block) {
                    if (!block) {
                        res.send("Unable to load block information.");
                        return next();
                    }
                    res.send(block)
                })
            } else {
                dbApi.get_block_height(req.params.block).then(function(block) {
                    if (!block) {
                        res.send("Unable to load block information.");
                        return next();
                    }
                    res.send(block)
                })
            }
        } catch (errorBlock) {
            res.send(errorBlock);
        }
    },
    loadTx: function(req, res, next) {
         dbApi.get_tx(req.params.txid).then(function(tx) {
             if (!tx) {
                 res.send("Unable to load transaction information.");
                 return next();
             }
             res.send(tx)
         }).catch(function(errorTx) {
             res.send(errorTx);
         });
    },
   // Get single asset data and dump JSON
   loadAsset: function(req, res, next) {
        dbApi.get_asset(req.params.asset).then(function(asset) {
            if (!asset) {
                res.send("Unable to load asset information.");
                return next();
            }
            res.send(asset)
        }).catch(function(errorAsset) {
            res.send(errorAsset);
        });
    },
    // Get assets data and dump JSON
    loadAssets: function(req, res, next) {
         dbApi.get_all_assets().then(function(assets) {
             if (!assets) {
                 res.send("Unable to load assets.");
                 return next();
             }
             res.send(assets)
         }).catch(function(errorAssets) {
             res.send(errorAssets);
         });
    },
    // Get address data, include corresponding tx data from tx collection and dump JSON
    loadAddress: function(req, res, next) {
        dbApi.get_address_txs(req.params.address, res.locals.utxoOnly).then(function(addrTxes) {
            if (!addrTxes) {
                res.send("Unable to load address information.");
                return next();
            }
            // include asset and value data to addrTxes
            include_tx_data(addrTxes).then(function(newAddrTxes) {
                if (!newAddrTxes) {
                    res.send("Unable to load tx information.");
                    return next();
                }
                res.send(newAddrTxes);
            }).catch(function(errorTx) {
              res.send(errorTx);
            });
        }).catch(function(errorAddress) {
            res.send(errorAddress)
        });
      },
    // Get info data and dump JSON
    loadInfo: function(req, res, next) {
        dbApi.get_blockchain_info().then(function(info) {
            if (!info) {
                res.send("Unable to load info");
                return next();
            }
            resp = {}
            resp['chain'] = info.chain;
            resp['blockheight'] = info.latestStoredHeight;
            resp['blockhash'] = info.blockchaininfo.bestblockhash;
            resp['attestedheight'] = info.latestAttestedHeight;
            resp['attestationtxid'] = info.latestAttestationTxid;
            resp['mainstayposition'] = res.locals.env.attestation.position;
            res.send(resp);
        }).catch(function(errorInfo) {
            res.send(errorInfo);
        });
    }
}
