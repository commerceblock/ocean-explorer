/*
 * @api.js Main Api controller
 * Functionality to handle http api requests via the router
 * Functionality to get information from database and return as JSON object
 */

var dbApi = require("../controllers/database");

module.exports = {
   // Get assets data from blockchain info and render mempool page
   loadAssets: function(req, res, next) {
        dbApi.get_all_assets().then(function(assets) {
            if (!assets) {
                res.send("Unable to load assets");
                return next();
            }
            res.send(assets)
        }).catch(function(errorAsset) {
            res.locals.userMessage = errorAsset;
            return next();
        });
    }
}
