/*
 * @addr.js Address Model for Mongo database based on mongoose
 *
 * @author Tomos Wootton 2019
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Address schema
// Indices used: address, asset
var AddrSchema = new Schema({
    address:    { type: String, index: true },
    txid:       String,
    vout:       Number,
    asset:      String,
    assetlabel: String,
    istoken:    Boolean,
    value:      Number,
    isSpent:    { type: Boolean, default: false }
});

// Compounded index for quick lookup on txid/vout pairs
AddrSchema.index({ txid: 1, vout: 1 });

//
// Address model used for saving and/or lookups
module.exports = mongoose.model('Addr', AddrSchema);
