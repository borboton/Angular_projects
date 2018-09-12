'use strict'

// var path = require('path');
// var fs = require('fs');
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');


function saveFollow(req,res) {
    var params = req.body;

    var follow = new Follow();

    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save( (err,followStored) => {
        if(err) return res.status(500).send({message: 'Error al guardar el follow'});

        if(!followStored) return res.status(404).send({message: 'El usuario a seguir no existe'});

        res.status(200).send({ 
            follow: followStored
        });
    } );

    
};

function deleteFollow(req,res) {
    var userId = req.user.sub;
    var followId = req.params.id;


    Follow.find({ user: userId, followed:  followId }).remove(
        (err) => {
            if(err) return res.status(500).send({message: 'Server Internal Error'});
            res.status(200).send({ 
                message: 'Deja de seguir a: '+followId
            });
    } );

    
};

function getFollowingUsers(req,res){
    var userId = req.user.sub;

    if(req.params.id){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Follow.find({user: userId})
            .populate({path: 'followed'})
            .paginate(page,itemsPerPage, (err, follows, total) => {
                if(err) return res.status(500).send({message: 'Server Internal Error'});
                if(!follows || follows.length == 0 ) return res.status(404).send({message: 'No tiene seguimientos'});
                
                
                followUserIds(userId).then(fol => {
                    // return res.status(200).send({
                    //     users,
                    //     users_following: follows.following,
                    //     users_follow_me: follows.followed,
                    //     total,
                    //     pages: Math.ceil(total/itemsPerPage)
                    // });
                    return res.status(200).send({
                        total,
                        pages: Math.ceil(total/itemsPerPage),
                        follows,
                        users_following: fol.following,
                        users_follow_me: fol.followed
                    });
                }).catch(err => {
                    return handleerror(err);
                });
                
    })
}

function getFollowedUsers(req,res){
    var userId = req.user.sub;

    if(req.params.id){
        userId = req.params.id;
    }

    var page = 1;

    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    Follow.find({followed: userId})
        .populate({path: 'user followed'})
        .paginate(page,itemsPerPage, (err, follows, total) => {
            if(err) return res.status(500).send({message: 'Server Internal Error'});
            if(!follows || follows.length == 0 ) return res.status(404).send({message: 'No te sigue ningun usuario'});
            
            return res.status(200).send({
                total,
                pages: Math.ceil(total/itemsPerPage),
                follows
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

// Devolver usuarios que sigo o que me siguen -> boolean followed
function getMyFollows(req,res){
    var userId = req.user.sub;
    var find = null;
    if(req.params.followed){
        find = Follow.find({user:userId});
    } else {
        find = Follow.find({followed:userId});
    }

    find.populate('user followed').exec( (err,follows) =>{
        if(err) return res.status(500).send({message: 'Server Internal Error'});
        if(!follows || follows.length == 0 ) return res.status(404).send({message: 'No sigues a ningun usuario'});

        return res.status(200).send({ follows });
    });
}


module.exports = {
    saveFollow,
    deleteFollow,
    getFollowingUsers,
    getFollowedUsers,
    getMyFollows
}