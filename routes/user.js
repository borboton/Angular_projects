'use strict'

var express = require('express');
var UserController = require('../controllers/user');

var api = express.Router();
var md_auth = require('../middlewares/authenticated');
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir: './uploads/users'});

// GET
api.get('/home', md_auth.ensureAuth, UserController.home);
api.get('/pruebas', md_auth.ensureAuth, UserController.pruebas);
api.get('/user/:id', md_auth.ensureAuth, UserController.getUser);
api.get('/users/:page?', UserController.getUsers);
api.get('/get-image-user/:imageFile', UserController.getImageFile);
api.get('/counters/:id?', md_auth.ensureAuth,UserController.getCounters);

// POST
api.post('/register', UserController.saveUser);
api.post('/login', UserController.loginUser);
api.post('/update-image-user/:id', [md_auth.ensureAuth,md_upload], UserController.updateImage);

// PUT
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);


module.exports = api;