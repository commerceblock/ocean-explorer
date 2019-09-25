/*
 * @asset.js Asset Model for Mongo database based on mongoose
 *
 * @author Nikolaos Kostoulas 2018
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Asset schema
// Indices used:
var AssetSchema = new Schema({
    asset:            { type: String, index: { unique: true } },
    assetamount:      Number,
    assetlabel:       {type: String, default: ""},
    token:            String,
    tokenamount:      {type: Number, default: 0},
    issuancetx:       String,
    reissuedamount:   { type: Number, default: 0},
    destroyedamount:  { type: Number, default: 0}
});

// Asset model used for saving and/or lookups
module.exports = mongoose.model('Asset', AssetSchema);
