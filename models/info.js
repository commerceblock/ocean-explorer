/*
 * @info.js Info Model for Mongo database based on mongoose
 * @author Nikolaos Kostoulas 2018
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var InfoSchema = new Schema({
    chain:          { type: String, index: { unique: true } },
    blockchaininfo: Object,
    networkinfo:    Object,
    nettotals:      Object,
    mempoolinfo:    Object,
    mempoolstats:   Object
});

module.exports = mongoose.model('Info', InfoSchema);
