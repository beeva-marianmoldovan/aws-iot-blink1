'use strict';
// SDK de AWS para gestionar dispositivo y thing shadow
var awsIot = require('aws-iot-device-sdk');
// Librería para escribir y leer color de un dispositivo Blink{1}
var Blink1 = require('node-blink1');

// Credenciales de AWS IoT
var credentials = require('./credentials.js');

var blink1 = new Blink1();;
var thing = awsIot.thingShadow(credentials);

var firstClientToken;

// Obligatoriamente nos tenemos que registrar para recibir actualizaciones/mensajes relacionados
thing.register(credentials.thingName);
// Nos subscribimos al topic /blink1/commands de mqtt dentro de aws iot
thing.subscribe('/commands/blink1');

thing.on('connect', function() {
  console.log('connected to AWS IoT');
});

thing.on('message', function(topic, message) {
  console.log('message', topic, message.toString());
  if(message.toString() == 'random'){
    var r = Math.round(255 * Math.random());
    var g = Math.round(255 * Math.random());
    var b = Math.round(255 * Math.random());
    blink1.fadeToRGB(100, r, g, b);
    thing.update(credentials.thingName, {'state':{'desired':null, 'reported':{'color':{r:r,g:g,b:b}}}});
  }
});

thing.on('status', function(thingName, stat, clientToken, stateObject) {
  console.log('status', clientToken, 'received', stat, 'on', thingName, ': ', JSON.stringify(stateObject));
  // Si fuera la primera ejecución, recuperamos estado del Blink1
  if(firstClientToken == clientToken && stateObject.state.reported) {
    var color = stateObject.state.reported.color;
    blink1.fadeToRGB(100, color.r, color.g, color.b);
    if(stateObject.state.delta)
      updateBlinkAndReport(stateObject.state.delta.color)
  }
  // Comprobamos si hay modificaciones pendientes
  else if(stateObject.state.desired){
    var color = stateObject.state.desired.color;
    blink1.fadeToRGB(100, color.r, color.g, color.b);
    thing.update(credentials.thingName, {'state':{'desired':null, 'reported':{'color':{r:red,b:blue,g:green}}}});
  }
});

thing.on('delta', function(thingName, stateObject) {
  console.log('delta', thingName, JSON.stringify(stateObject));
  if(stateObject.state.color)
    updateBlinkAndReport(stateObject.state.color)
});

// Componemos el color del blink con el estado actual (último reported) + delta
function updateBlinkAndReport(color){
  blink1.rgb(function(r,g,b){
    var red = color.r != undefined ? color.r: r;
    var blue = color.b != undefined ? color.b: b;
    var green = color.g != undefined ? color.g: g;
    blink1.fadeToRGB(100, red, green, blue);
    // Actualizamos estado reportado para sincronizar shadow
    thing.update(credentials.thingName, {'state':{'desired':null, 'reported':{'color':{r:red,b:blue,g:green}}}});
  });
}

thing.on('timeout', function(thingName, clientToken) {
  console.log('timeout', topic, message);
});

thing.on('error', function(error) {
  console.log('error', error);
});

// En la primera ejecución recuperamos el último estado del blink
firstClientToken = thing.get(credentials.thingName);
