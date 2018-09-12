'use strict'


var express = require('express');
var FollowController = require('../controllers/follow');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');

// Delete
api.delete('/follow/:id', md_auth.ensureAuth, FollowController.deleteFollow);

// POST
api.post('/follow', md_auth.ensureAuth, FollowController.saveFollow);

// GET
api.get('/following/:page?/:id?', md_auth.ensureAuth, FollowController.getFollowingUsers);
api.get('/followed/:page?/:id?', md_auth.ensureAuth, FollowController.getFollowedUsers);
api.get('/get-my-follows/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);

module.exports = api;