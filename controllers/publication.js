'use strict'

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

function savePublication(req,res){
    var params = req.body;
    var publication = new Publication();

    if(!params.text){
        return res.status(200).send({ message: 'El campo de texto es requerido'});
    }

    publication.text = params.text;
    publication.file = null;
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err,publicationStored) => {
        if(err) return res.status(500).send({message: 'Server Internal Error - savePublication'});

        if(!publicationStored) return res.status(404).send({message: 'Fallo al guardar la publicacion'});
        return res.status(200).send({publication: publicationStored});
    })
}

function getPublications(req,res){
    var userId = req.user.sub;
    var page = 1;

    if(req.params.page) page = req.params.page;

    var itemsPerPage = 4;

    Follow.find({ user: userId }).populate('followed')
                            .exec()
                            .then(follows => {
                                var follows_clean = [];
                                follows.forEach(follow => {
                                    follows_clean.push(follow.followed);
                                });
                                follows_clean.push(req.user.sub);
                                Publication.find({user: {$in:follows_clean}})
                                            .sort('-created_at')
                                            .populate('user')
                                            .paginate(page,itemsPerPage, (err, publications,total) => {
                                                if(err) return res.status(500).send({message: 'Server Internal Error - savePublication'});
                                                // if(!publications || publications.length == 0) return res.status(404).send({message: 'No hay publicaciones'});
                                                if(!publications || publications.length == 0) return res.status(200).send({message: 'No hay publicaciones'});

                                                return res.status(200).send({
                                                    publications,
                                                    total,
                                                    page,
                                                    items_per_page: itemsPerPage,
                                                    pages: Math.ceil(total/itemsPerPage)
                                                });
                                            })
                            }).catch(err => {
                                return res.status(500).send({message: 'Server Internal Error - getublication'});
                            });
}

function getPublication(req,res){
    var publicationId = req.params.id;

    Publication.findById(publicationId).populate('user').exec()
                    .then(publication => {
                        return res.status(200).send({publication});
                    }).catch(err => {
                        return res.status(500).send({message: 'Server Internal Error - getublication'});
                    });
}
function getPublicationsUser(req,res){
    var userId = req.user.sub;
    var page = 1;
    if(req.params.id) {
        userId = req.params.id;
    }

    if(req.params.page) page = req.params.page;

    var itemsPerPage = 4;

   
    Publication.find({user: userId})
                .sort('-created_at')
                .populate('user')
                .paginate(page,itemsPerPage, (err, publications,total) => {
                    if(err) return res.status(500).send({message: 'Server Internal Error - savePublication'});
                    // if(!publications || publications.length == 0) return res.status(404).send({message: 'No hay publicaciones'});
                    if(!publications || publications.length == 0) return res.status(200).send({message: 'No tiene publicaciones'});

                    return res.status(200).send({
                        publications,
                        total,
                        page,
                        items_per_page: itemsPerPage,
                        pages: Math.ceil(total/itemsPerPage)
                    });
                });
                            
}
function deletePublication(req,res){
    var publicationId = req.params.id;

    Publication.find({ user: req.user.sub, _id: publicationId})
                .remove((err,publicationRemoved) =>{
                    if(err) return res.status(500).send({message: 'Server Internal Error - deletePublication'});
                    console.log(publicationRemoved);
                    // if(!publicationRemoved) return res.status(404).send({message: 'No puede borrar la publicacion'});
                    return res.status(200).send({message: 'Publicacion eliminada'});

                });               
}

function uploadImage(req,res){
    var publicationId = req.params.id;
    
    if(req.files){
        console.log('files: ', req.files);
        var file_path = req.files.image.path;
        var file_name = file_path.split('/')[2];
        var exp_split = file_name.split('\.');
        var file_ext = exp_split[1].toLowerCase();
        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            Publication.findOne({user: req.user.sub,_id: publicationId}).exec((err,publication) => {
                if(publication){
                    Publication.findOneAndUpdate({ _id: publicationId }, {file: file_name}, { new: true }, (err,publicationUpdated) => {
                        if(err) return res.status(500).send({message:'Error en la peticion'});
                        if(!publicationUpdated) return res.status(404).send({message: 'No se pudo actualizar la publicacion'});
                
                        res.status(200).send({publication: publicationUpdated});
                    });
                } else {
                    return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar.');

                }
            })
            
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
    var path_file = './uploads/publication/' + image_file;

    fs.exists(path_file, (exists) => {
        if(exists){
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({message: 'No existe la imagen'});
        }
    })
}
module.exports = {
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getPublicationsUser,
    getImageFile
}