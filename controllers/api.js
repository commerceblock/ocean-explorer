/*
 * @api.js Main Api controller
 * Functionality to handle http api requests via the router
 * Functionality to get information from database and return as JSON object
 *
 * @author Tomos Wootton 2019
 *
 */

var dbApi = require("../controllers/database");

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
                dbApi.get_asset_token(req.params.asset).then(function(asset) {
                    if (!asset) {
                        res.send("Unable to load asset information.");
                        return next();
                    }
                    asset.assetamount /= (10**8);
                    asset.tokenamount /= (10**8);
                    asset.reissuedamount /= (10**8);
                    res.send(asset);
                }).catch(function(errorAsset) {
                    res.send(errorAsset);
                });
            } else {
                asset.assetamount /= (10**8);
                asset.tokenamount /= (10**8);
                asset.reissuedamount /= (10**8);
                res.send(asset);
            }
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
            ret = {}
            ret.assets = [];
            ret.policy_assets = [];
            assets.forEach(asset => {
                asset.assetamount /= (10**8);
                asset.tokenamount /= (10**8);
                asset.reissuedamount /= (10**8);
                if (asset.assetlabel) {
                    ret.policy_assets.push(asset);
                } else {
                    ret.assets.push(asset);
                }
            });
             res.send(ret);
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
            res.send(addrTxes);
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
