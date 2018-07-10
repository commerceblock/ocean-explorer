var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TxSchema = new Schema({
    txid:       { type: String, index: { unique: true } },
    blockhash:  { type: String, index: true},
    blockheight:{ type: Number, index: true},
    rpcdata:    Object
});

module.exports = mongoose.model('Tx', TxSchema);
