/*
 * @asset.js Asset Model for Mongo database based on mongoose
 *
 * @author Tomos Wootton 2019
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Asset schema
// Indices used: asset and token
var AssetSchema = new Schema({
    asset:            { type: String, index: { unique: true } },
    assetamount:      { type: Number, default: 0},
    assetlabel:       { type: String, default: ""},
    token:            { type: String, index: { unique: true } },
    tokenamount:      { type: Number, default: 0},
    issuancetx:       String,
    reissuedamount:   { type: Number, default: 0},
    destroyedamount:  { type: Number, default: 0}
});

// Asset model used for saving and/or lookups
module.exports = mongoose.model('Asset', AssetSchema);
