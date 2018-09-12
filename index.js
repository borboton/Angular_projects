'use strict'
var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;
mongoose.Promise = global.Promise;

// Conexion a DB
mongoose.connect('mongodb://10.245.107.135:27017/backend',{ useNewUrlParser: true})
        .then(() => {
            console.log("Conexion exitosa a la base de datos de mongoDB");
            // Crear servidor
            app.listen(port, () => {
                console.log('Node levantado en el puerto: ' + port);
            });
        })
        .catch((err) => {
            throw err;
        });
