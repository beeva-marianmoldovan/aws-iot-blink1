'use strict';
// SDK de AWS para gestionar dispositivo y thing shadow
var awsIot = require('aws-iot-device-sdk');
// Librería para escribir y leer color de un dispositivo Blink{1}
var Blink1 = require('node-blink1');

// Credenciales de AWS IoT
var credentials = require('./credentials.js');

// Controlador del led blink1
var blink1 = new Blink1();
var device = awsIot.device(credentials);

// Cuando nos conectamos al dispositivo, nos suscribimos al topic /commands/blink1
device.on('connect', function() {
  console.log('connected to AWS IoT');
  device.subscribe('/commands/blink1');
});

// Cuando llegue un mensaje con el contenido random al topic /commands/blink1, generamos un color aleatorio y lo reportamos al topic /random/topic
device.on('message', function(topic, message) {
  console.log('message', topic, message.toString());
  if(message.toString() == 'random'){
    var r = Math.round(255 * Math.random());
    var g = Math.round(255 * Math.random());
    var b = Math.round(255 * Math.random());
    blink1.fadeToRGB(100, r, g, b);
    device.publish('/random/topic', JSON.stringify({'r': r, 'g': g, 'b': b}));
  }
});
