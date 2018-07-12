/*
 * @tx.js Tx Model for Mongo database based on mongoose
 * @author Nikolaos Kostoulas 2018
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var TxSchema = new Schema({
    txid:               { type: String, index: { unique: true } },
    blockhash:          { type: String, index: true},
    blockheight:        { type: Number, index: true},
    getrawtransaction:  Schema.Types.Mixed
});

module.exports = mongoose.model('Tx', TxSchema);
