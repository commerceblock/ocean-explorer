var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InfoSchema = new Schema({
    chain:          { type: String, index: { unique: true } },
    blockchaininfo: Object,
    networkinfo:    Object,
    nettotals:      Object
});

module.exports = mongoose.model('Info', InfoSchema);
