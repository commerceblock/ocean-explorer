/*
 * @addr.js Address Model for Mongo database based on mongoose
 *
 * @author Tomos Wootton 2019
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Asset schema
// Indices used: asset
var AddrSchema = new Schema({
    address:    { type: String, index: true },
    txid:       String,
    vout:       { type: Number, index: true}, 
    isSpent:    { type: Boolean, default: false }
});

// Address model used for saving and/or lookups
module.exports = mongoose.model('Addr', AddrSchema);
