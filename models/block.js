/*
 * @block.js Block Model for Mongo database based on mongoose
 *
 * @author Nikolaos Kostoulas 2018
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

// Block schema
// Indices used: hash, height
var BlockSchema = new Schema({
    hash:       { type: String, index: { unique: true } },
    height:     { type: Number, index: { unique: true } },
    getblock:   Object
});

// Block model used for saving and/or lookups
module.exports = mongoose.model('Block', BlockSchema);
