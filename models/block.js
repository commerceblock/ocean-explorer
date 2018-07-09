var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BlockSchema = new Schema({
    hash:       { type: String, index: { unique: true } },
    height:     { type: Number, index: { unique: true } },
    rpcdata:    Object
});

module.exports = mongoose.model('Block', BlockSchema);
