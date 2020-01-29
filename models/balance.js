/*
 * @balance.js Balance model
 *
 * @author Nikolaos Kostoulas 2019
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Balance schema
// Indices used: address, unspent
var BalanceSchema = new Schema({
    address:    { type: String, index: 1},
    received:   Number,
    unspent:    { type: Number, index: -1},
    assets:     { type: Map, of: Number},
    offset:     Schema.Types.ObjectId // offset from Tx table to keep track of updates
});

// Balance model used for saving and/or lookups
module.exports = mongoose.model('Balance', BalanceSchema);
