/*
 * @tx.js Tx Model for Mongo database based on mongoose
 *
 * @author Nikolaos Kostoulas 2018
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Tx schema
// Indices used: txid, blockhash, blockheight
var TxSchema = new Schema({
    txid:               { type: String, index: { unique: true } },
    blockhash:          { type: String, index: true},
    blockheight:        { type: Number, index: true},
    getrawtransaction:  Schema.Types.Mixed
});

// Tx model used for saving and/or lookups
module.exports = mongoose.model('Tx', TxSchema);
