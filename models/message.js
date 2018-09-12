'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = Schema({
    emitter: { type: Schema.ObjectId, ref: 'User'},
    receiver: { type: Schema.ObjectId, ref: 'User'},
    conversationId: String,
    viewed: String,
    text: String,
    created_at: String
});

module.exports = mongoose.model('Message', MessageSchema);