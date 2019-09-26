/*
 * @info.js Info Model for Mongo database based on mongoose
 *
 * @author Nikolaos Kostoulas 2018
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Info schema
// Indices used: chain
var InfoSchema = new Schema({
    chain:          { type: String, index: { unique: true } },
    latestStoredHeight: Number,
    latestAttestedHeight: Number,
    latestAttestationTxid: String,
    blockchaininfo: Object,
    networkinfo:    Object,
    nettotals:      Object,
    mempoolinfo:    Object,
    mempoolstats:   Object
});

// Info model used for saving and/or lookups
module.exports = mongoose.model('Info', InfoSchema);
