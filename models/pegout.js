/*
 * @addr.js Pegout Model for Mongo database based on mongoose
 *
 * @author Nikolaos Kostoulas 2019
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Pegout schema
// Indices used: txid
var PegoutSchema = new Schema({
    txid:       { type: String, index: { unique: true } },
    address:    { type: String},
    amount:     { type: Number},
    isPaid:     { type: Boolean, default: false},
    receipt:    { type: Object},
    eth_txid:   { type: String} // prev txid in case of failure
});

// Pegout model used for saving and/or lookups
module.exports = mongoose.model('Pegout', PegoutSchema);
