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
   // Get assets data and dump JSON
   loadAssets: function(req, res, next) {
        dbApi.get_all_assets().then(function(assets) {
            if (!assets) {
                res.send("Unable to load assets.");
                return next();
            }
            res.send(assets)
        }).catch(function(errorAsset) {
            res.locals.userMessage = errorAsset;
            return next();
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
             res.locals.userMessage = errorAddress;
             return next();
         });
     }
}
