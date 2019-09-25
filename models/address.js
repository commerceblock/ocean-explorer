/*
 * @address.js Address Model for Mongo database based on mongoose
 *
 * @author Tomos Wootton 2019
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Asset schema
// Indices used: asset
var AddressSchema = new Schema({
    address:    { type: String, index: true },
    txid:       String,
    vout:       Number,
    isSpent:    Boolean
});

// Address model used for saving and/or lookups
module.exports = mongoose.model('Address', AddressSchema);
