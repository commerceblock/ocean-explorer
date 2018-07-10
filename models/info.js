var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InfoSchema = new Schema({
    chain:          { type: String, index: { unique: true } },
    blockcount:     Number,
    bestblockhash:  String,
});

module.exports = mongoose.model('Info', InfoSchema);
