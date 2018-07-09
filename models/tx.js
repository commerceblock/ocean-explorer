var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TxSchema = new Schema({
    txid:       { type: String, index: { unique: true } },
    rpcdata:    Object
});

module.exports = mongoose.model('Tx', TxSchema);
