'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');
var mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

var Message = require('../models/message');
var User = require('../models/user');
var Follow = require('../models/follow');

function saveMessage(req,res){
    var params = req.body;
    if(!params.text || !params.receiver){
        return res.status(404).send({ message: 'Faltan campos necesarios.'});
    }

    var message = new Message();

    message.text = params.text;
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.conversationId = [req.user.sub, params.receiver].sort().join('.');
    message.created_at = moment().unix();
    message.viewed = 'false';

    message.save((err, messageStored) => {
        if(err) return res.status(500).send({message: 'Server Internal Error - saveMessage'});

        if(!messageStored) return res.status(500).send({message: 'Error al enviar el mensaje'});

        return res.status(200).send({message: messageStored});

    });
}

function getReceivedMessages(req,res){
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    // .populate({path: 'user followed'}).select({'password':0})
    // Message.find({receiver:userId}).populate('emitter','name surname _id image nick').paginate(page,itemsPerPage, (err,messages,total) => {
    Message.find({receiver:userId}).populate('emitter','name surname _id image nick').paginate(page,itemsPerPage, (err,messages,total) => {

        if(err) return res.status(500).send({message: 'Server Internal Error - getReceiverMessages'});

        if(!messages || messages.length == 0) return res.status(500).send({message: 'No tienes mensajes'});

        return res.status(200).send(
            {
                messages,
                total,
                page: page,
                pages: Math.ceil(total/itemsPerPage)
            });
    });
}

function getEmmitMessages(req,res){
    var userId = req.user.sub;
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    var itemsPerPage = 4;
    Message.find({emitter:userId}).populate({path: 'receiver emitter'}).select({'password':0}).paginate(page,itemsPerPage, (err,messages,total) => {

    // Message.find({emitter:userId}).populate('receiver','name surname _id image nick').paginate(page,itemsPerPage, (err,messages,total) => {
        if(err) return res.status(500).send({message: 'Server Internal Error - getReceiverMessages'});

        if(!messages || messages.length == 0) return res.status(500).send({message: 'No tienes mensajes enviados'});

        return res.status(200).send(
            {
                messages,
                total,
                page: page,
                pages: Math.ceil(total/itemsPerPage)
            });
    });
}

function getAllMessages(req,res){
    var userId = req.user.sub;
    // var page = 1;
    // if(req.params.page){
    //     page = req.params.page;
    // }
    // var itemsPerPage = 4;

console.log('all-messages');

    let  selector = {};
    selector['$or'] = [
      {emitter : ObjectId(userId)},
      {receiver : ObjectId(userId)}
    ];
    let query = {
        $match : selector
    };
    let group = {
        $group: {
          _id: "$_id",
          text : { $last: '$text' },
          emitter : { $last: '$emitter' },
          receiver : { $last: '$receiver' },
          to : {$addToSet : '$receiver'},
          from: {$addToSet : '$emitter'},
          created_at : { $last: '$created_at' },
          count: { $sum: 1 }
        }
      };

      let project = {
        $project: {
          _id: "$_id",
          text: "$text",
          emitter: '$emitter',
          receiver: '$receiver',
          created_at : '$created_at',
          participants : {
            $cond: {
              if: {
                $gte: ["$from", "$to"] },
                then: { "$setUnion": ["$from", "$to"] },
                else:  { "$setUnion": ["$to", "$from"] }
              }
            }
          }
        };

        let group2 =   {
            $group: {
              _id: "$participants",
              text : { $first: '$text' },
              emitter : { $first: '$emitter' },
              receiver : { $first: '$receiver' },
              created_at : { $first: '$created_at' },
              count: { $sum: 1 }
            }
          };

        let project2 = {
            $project: {
                _id : 0,
                participants : "$_id",
                text: "$text",
                interlocutor_profile_id: {
                $cond: {
                    if: {"$eq": [ "$receiver", ObjectId(userId)]},
                    then: '$emitter',
                    else: '$receiver'
                }
            },
            created_at : 1,
            updated_at : 1,
            count: 1
            }
        }
    let  sort = {
        $sort: {
            "created_at": -1
          }
      }
      
      let sort2 = {
        $sort: {
            "created_at": -1
          }
      }
    // Message.find({ $or:[ 
    //                     {emitter: userId},
    //                     {receiver: userId},
    //                 ]
    //             }).populate({path: 'receiver emitter'}).sort('-created_at').exec((err,messages) => {

        // Message.aggregate([ {$match: {$or: [{'emitter': ObjectId(userId)},{'receiver': ObjectId(userId)}]}}, sort,
        //                 {$group: { _id: '$conversationId', vals: { '$push': '$text' } }},
        //                 {$limit: 1},
        //                 {$lookup:
        //                       {
        //                         from: "users",
        //                         localField: "emitter",
        //                         foreignField: "_id",
        //                         as: "users"
        //                       }} ]).exec((err,messages)=> {


Message.aggregate([ {$match: {$or: [{'emitter': ObjectId(userId)},{'receiver': ObjectId(userId)}]}}, 
                    { $sort: { created_at: -1} },
                    {
                        $group: {
                          _id: '$conversationId',
                          from : {$first: '$emitter'},
                          to: {$first: '$receiver'},
                          msg: {$first: '$text'},
                          viewed: {$first: '$viewed'},
                          timestamp: {$first: '$created_at'}
                        }
                      },
                      { 
                        $project:{
                            // "from": 1,
                            "to": 1,
                            "msg": 1,
                            "viewed": 1,
                            "timestamp": 1,
                            interlocutor_profile_id: {
                                $cond: {
                                    if: {"$eq": [ "$to", ObjectId(userId)]},
                                    then: '$from',
                                    else: '$to'
                                }
                            }
                        }
                    },
                      {
                            $lookup:
                              {
                                from: "users",
                                localField: "interlocutor_profile_id",
                                foreignField: "_id",
                                as: "userData"
                              }
                         },
                         {
                            $project: {
                              "userData.password": false,
                              "userData.role": false,
                              "interlocutor_profile_id": false
                            }
                        } ,
                         { $sort: { timestamp: -1} },

                    //      {
                    //         $lookup:
                    //           {
                    //             from: "users",
                    //             localField: "to",
                    //             foreignField: "_id",
                    //             as: "userTo"
                    //           }
                    //      },
                        //  { 
                        //     $project:{
                        //         "from": 1,
                        //         "to": 1,
                        //         "msg": 1,
                        //         "viewed": 1,
                        //         "timestamp": 1,
                        //         "userFrom2.email": "$userFrom.email",
                        //         userFrom : 
                        //          {
                        //             "name" : "$userFrom.name", 
                        //             "surname" : "$userFrom.surname", 
                        //             "nick" : "$userFrom.nick"
                        //          },
                        //          userTo : 
                        //          {
                        //             "name" : "$userTo.name", 
                        //             "surname" : "$userTo.surname", 
                        //             "nick" : "$userTo.nick"
                        //          }
                        //     }
                        // }
                     ]).exec((err,messages)=> {


            // Message.aggregate([ query,
            // {
            //     $lookup:
            //       {
            //         from: "users",
            //         localField: "emitter",
            //         foreignField: "_id",
            //         as: "users"
            //       }
            //  }]).exec((err,messages)=> {


    // Message.aggregate([query, group, project, sort, group2, project2, sort2]).exec((err,messages)=> {
    // Message.find({emitter:userId}).populate('receiver','name surname _id image nick').paginate(page,itemsPerPage, (err,messages,total) => {
        if(err) return res.status(500).send({message: 'Server Internal Error - getAllMessages'});
        // console.log(messages)
        if(!messages || messages.length == 0) return res.status(200).send({message: 'No tienes mensajes - allmessages'});
        
        return res.status(200).send(
            {   
                
                messages
                
            });
    });
}


function getUnviewedMessages(req,res){
    var userId = req.user.sub;

    Message.count({ receiver: userId, viewed: 'false'}).exec((err,count) =>{
        if(err) return res.status(500).send({message: 'Server Internal Error - getUnviewedMessages'});

        if(!count || count.length == 0) return res.status(500).send({message: 'No tienes mensajes sin leer'});

        return res.status(200).send(
            {
                'unviewed': count
                
            });
    })

}

function setViewedMessages(req,res){
    var userId = req.user.sub;

    Message.update({ receiver: userId, viewed: 'false'},{ viewed: 'true' },{ 'multi': true },
                        (err,messagesUpdated)=>{
                            if(err) return res.status(500).send({message: 'Server Internal Error - setViewedMessages'});
                            return res.status(200).send(
                                {
                                    messagesUpdated
                                    
                                });
                        })
}



module.exports = {
    saveMessage,
    getReceivedMessages,
    getEmmitMessages,
    getUnviewedMessages,
    getAllMessages,
    setViewedMessages
}