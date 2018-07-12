/*
 * @block.js Block Model for Mongo database based on mongoose
 * @author Nikolaos Kostoulas 2018
 */
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var BlockSchema = new Schema({
    hash:       { type: String, index: { unique: true } },
    height:     { type: Number, index: { unique: true } },
    getblock:   Object
});

module.exports = mongoose.model('Block', BlockSchema);
