'use strict'

var express = require('express');
var PublicationController = require('../controllers/publication');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/publication'});

// Delete
api.delete('/publication/:id', md_auth.ensureAuth, PublicationController.deletePublication);

// POST
api.post('/publication', md_auth.ensureAuth, PublicationController.savePublication);
api.post('/upload-image-pub/:id', [md_auth.ensureAuth, md_upload], PublicationController.uploadImage);



// GET
api.get('/publications-user/:id/:page?', md_auth.ensureAuth, PublicationController.getPublicationsUser);
api.get('/publications/:page?', md_auth.ensureAuth, PublicationController.getPublications);
api.get('/publication/:id', md_auth.ensureAuth, PublicationController.getPublication);
api.get('/get-image-pub/:imageFile', PublicationController.getImageFile);

// api.get('/followed/:page?/:id?', md_auth.ensureAuth, FollowController.getFollowedUsers);
// api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);

module.exports = api;