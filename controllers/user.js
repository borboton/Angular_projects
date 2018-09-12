'use strict'

var User = require('../models/user');
var Follow = require('../models/follow');
var Publication = require('../models/publication');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-pagination');
var fs = require('fs');
var path = require('path');

function home(req,res) {
    res.status(200).send({ 
        message: 'Usuario Home'
    });
};

function pruebas(req,res) {
    res.status(200).send({ 
        message: 'accopm de pueba'
    });
};

function saveUser(req,res) {
    var user = new User;
    var params = req.body;

    if(params.name && params.surname && params.nick && params.email && params.password){
        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;
        User.find({ $or:[ 
                            {email: user.email.toLowerCase()},
                            {nick: user.nick.toLowerCase()},
                        ]
                    }).exec((err,users) => {
                        if(err) return res.status(500).send({ message: 'Error al chequear el usuario'});
                        if( users && users.length >= 1 ){
                            return res.status(200).send({ message: 'El usuario ya existe'});
                        } else {
                            bcrypt.hash(params.password, null, null, (err, hash) => {
                                user.password = hash;
                                user.save((err, userStored) => {
                                    if(err) return res.status(500).send({ message: 'Error al guardar el usuario'});
                    
                                    if(userStored){
                                        res.status(200).send({user: userStored});
                                    } else {
                                        res.status(404).send({ message: 'No se ha registrado el usuario' });
                                    }
                                })
                            }); 
                        }
                    });
    } else {
        res.status(200).send({ message: 'Hay campos incompletos.' });
    }
}

function loginUser (req,res){
    var params = req.body;
    var email = params.email;
    var password = params.password;
    var nick = params.nick;
    User.findOne({email:email}).exec( (err,user) => {
        if(err) return res.status(500).send({ message: 'Error en la peticion.'});

        if(user) {
            bcrypt.compare(password,user.password, (err, check) => {
                if(check){
                    if(params.gettoken){
                        // generar y devolver token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    } else {
                        // devolver los datos 
                        user.password = undefined;
                        res.status(200).send({user: user});
                    }
                    
                } else {
                    res.status(404).send({ message: 'Password incorrecto.'});
                }
            })
        } else {
            res.status(404).send({ message: 'El usuario no existe.'});
        }
    });
}

function getUser(req,res){
    var userId = req.params.id;

    User.findById(userId, (err,user) => {
        if(err) return res.status(500).send({message:err});

        if(!user) return res.status(404).send({message: 'El usuario no existe'});

        user.password = undefined;

        followThisUser(req.user.sub, userId).then( (follows) =>{
            return res.status(200).send({user, follows});
        }).catch((err)=>{
                return handleerror(err);
        });
        
            
        
    });
}
async function followThisUser(identity_user_id, user_id){
    try {
        console.log(identity_user_id, user_id)
        var following = await Follow.findOne({ user: identity_user_id, followed: user_id}).exec()
            .then((following) => {
                console.log(following);
                return following;
            })
            .catch((err)=>{
                return handleerror(err);
            });
        var followed = await Follow.findOne({ user: user_id, followed: identity_user_id}).exec()
            .then((followed) => {
                console.log(followed);
                return followed;
            })
            .catch((err)=>{
                return handleerror(err);
            });
        return {
            following: following,
            followed: followed
        }
    } catch(e){
        console.log(e);
    }
}

// Listado de todos los usuarios paginados
function getUsers(req,res){
    var identity_user_id = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page
    }
    var itemsPerPage = 4;
    if(req.params.itemsPerPage){
        itemsPerPage = req.params.itemsPerPage;
    }

    User.find({ "_id": { "$nin": [ identity_user_id ] } }).sort('_id').select({'password':0}).paginate(page,itemsPerPage, (err, users, total) => {
        if(err) return res.status(500).send({message:'Error en la peticion'});
        if(!users) return res.status(404).send({message: 'No hay usuarios'});
        followUserIds(identity_user_id).then(follows => {
            return res.status(200).send({
                users,
                users_following: follows.following,
                users_follow_me: follows.followed,
                total,
                pages: Math.ceil(total/itemsPerPage)
            });
        }).catch(err => {
            return handleerror(err);
        });
        
    });
}

async function followUserIds(user_id){
    var following = await Follow.find({ user: user_id }).select({'_id':0,'_v':0,'user':0})
        .exec()
        .then(follows => {
            var follows_clean = [];
            follows.forEach( follow => {
                follows_clean.push(follow.followed);
            });
            return follows_clean;
        }).catch( (err)=>{
            return handleerror(err);
        });
    var followed = await Follow.find({ followed: user_id }).select({'_id':0,'_v':0,'followed':0})
        .exec()
        .then(follows => {
            var follows_clean = [];
            follows.forEach( follow => {
                follows_clean.push(follow.user);
            });
            return follows_clean;
        }).catch( (err)=>{
            return handleerror(err);
        });

    return {
        following,
        followed
    }
}

function getCounters(req,res){
    var userId = req.user.sub;
    if(req.params.id){
        userId = req.params.id;
    }
    

    getCountFollow(userId)
        .then(value => {
            return res.status(200).send(value)
        })
        .catch(err => {
            handleError(err)
        });
}

async function getCountFollow(user_id){
    var following = await Follow.count({ user: user_id }).exec()
    .then(count => {
        return count;
    }).catch(err=> handleError(err));

    var followed = await Follow.count({ followed: user_id }).exec()
    .then(count => {
        return count;
    }).catch(err=> handleError(err));
    
    var publications = await Publication.count({ user: user_id }).exec()
    .then(count => {
        return count;
    }).catch(err=> handleError(err));

    return { 
        following,
        followed,
        publications
    }
}

function updateUser(req,res){
    var userId = req.params.id;
    var update = req.body;
    delete update.image;
    delete update.password;
    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permisos para actualizar los datos'});
    }
    User.find( {
        _id: { $nin: [ userId ] },
        $and : [{ $or: [
            {email: update.email.toLowerCase()},
                {nick: update.nick.toLowerCase()},
            ]}
        ]
    }
    ).exec((err,users) => {
        if(err) return res.status(500).send({err});
        if(users.length > 0){
            return res.status(404).send({message: 'Ya existe'});
        } else {
            // console.log('userid antes del update: '+userId)
            // console.log('datos para update: ',update)
            User.findOneAndUpdate( { _id: userId}, update, { new: true }, (err,userUpdated) => {
                if(err) return res.status(500).send({err});
                if(!userUpdated) return res.status(404).send({message: 'No se pudo actualizar los datos del usuario'});
        
                res.status(200).send({user: userUpdated});
            });
        }
    })
    
}

// Subir archivos de imagen/avatar de usuario
function updateImage(req,res){
    var userId = req.params.id;

    if(userId != req.user.sub){
        return removeFilesOfUploads(res, file_path, 'No tienes permisos para actualizar los datos.');
        // return res.status(500).send({message: 'No tienes permisos para actualizar los datos'});
    }
    if(req.files){
        var file_path = req.files.image.path;
        var file_name = file_path.split('/')[2];
        var exp_split = file_name.split('\.');
        var file_ext = exp_split[1].toLowerCase();

        // console.log('userId para actualizar la foto: ' + userId);
        // console.log('nombre del archivo: '+ file_name);
        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            User.findOneAndUpdate({ _id: userId}, {image: file_name}, { new: true }, (err,userUpdated) => {
                    if(err) return res.status(500).send({message:'Error en la peticion'});
                    if(!userUpdated) return res.status(404).send({message: 'No se pudo actualizar los datos del usuario'});
            
                    res.status(200).send({user: userUpdated});
                });
        } else {
            return removeFilesOfUploads(res, file_path, 'Extension no valida.');
        }
    } else {
        return res.status(404).send({message: 'No hay archivos para subir'});
    }
}

function removeFilesOfUploads(res, file_path, message) {
    fs.unlink(file_path, (err) => {
        return res.status(200).send({message: message});
    });
}

function getImageFile(req,res){
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/' + image_file;

    fs.exists(path_file, (exists) => {
        if(exists){
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({message: 'No existe la imagen'});
        }
    })
}
module.exports = {
    home,
    pruebas,
    saveUser,
    getUser,
    loginUser,
    getUsers,
    updateUser,
    updateImage,
    getImageFile,
    getCounters
}