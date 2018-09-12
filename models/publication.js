'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PublicationSchema = Schema({
    user: { type: Schema.ObjectId, ref: 'User'},
    text: String,
    created_at: String,
    file: String
});

module.exports = mongoose.model('Publication', PublicationSchema);