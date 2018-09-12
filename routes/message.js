'use strict'

var express = require('express');
var MessageController = require('../controllers/message');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

// Delete
// api.delete('/publication/:id', md_auth.ensureAuth, PublicationController.deletePublication);

// POST
api.post('/message', md_auth.ensureAuth, MessageController.saveMessage);
// api.post('/upload-image-pub/:id', [md_auth.ensureAuth, md_upload], PublicationController.uploadImage);



// GET
api.get('/my-messages/:page?', md_auth.ensureAuth, MessageController.getReceivedMessages);
api.get('/messages/:page?', md_auth.ensureAuth, MessageController.getEmmitMessages);
api.get('/unviewed-messages', md_auth.ensureAuth, MessageController.getUnviewedMessages);
api.get('/all-messages', md_auth.ensureAuth, MessageController.getAllMessages);

// UPDATE
api.put('/set-viewed-messages', md_auth.ensureAuth, MessageController.setViewedMessages);

// api.get('/publication/:id', md_auth.ensureAuth, PublicationController.getPublication);
// api.get('/get-image-pub/:imageFile', PublicationController.getImageFile);

// api.get('/followed/:page?/:id?', md_auth.ensureAuth, FollowController.getFollowedUsers);
// api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);

module.exports = api;