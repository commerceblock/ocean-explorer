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
    // Get address data and dump JSON
    loadAddress: function(req, res, next) {
         dbApi.get_address_txs(req.params.address).then(function(addrTxs) {
             if (!addrTxs) {
                 res.send("Unable to load address information.");
                 return next();
             }
             res.send(addrTxs)
         }).catch(function(errorAddress) {
             res.send(errorAddress);
         });
     },
     loadUtxos: function(req, res, next) {
          dbApi.get_address_utxos(req.params.address).then(function(addrUtxos) {
              if (!addrUtxos) {
                  res.send("Unable to load address information.");
                  return next();
              }
              res.send(addrUtxos)
          }).catch(function(errorAddress) {
              res.send(errorAddress);
          });
      }
}
