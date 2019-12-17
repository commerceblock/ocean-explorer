/*
 * @addr.js Address Model for Mongo database based on mongoose
 *
 * @author Tomos Wootton 2019
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Address schema
// Indices used: address, vout
var AddrSchema = new Schema({
    address:    { type: String, index: true },
    txid:       String,
    asset:      { type: String, index: true },
    vout:       Number,
    value:      Number,
    isSpent:    { type: Boolean, default: false }
});

//
// Address model used for saving and/or lookups
module.exports = mongoose.model('Addr', AddrSchema);
