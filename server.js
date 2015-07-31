var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var serialport = require("serialport");

var SerialPort = serialport.SerialPort; // localize object constructor


var PORT_NAME = 'COM4';


var cleanData = ''; // this stores the clean data
var readData = '';  // this stores the buffer

server.listen(3000);
console.log("listening to port 3000");

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/smoothie.js', function (req, res){
  res.sendFile(__dirname + '/resources/smoothie.js');
});

app.get('/theme.js', function (req, res){
  res.sendFile(__dirname + '/resources/theme.js');
});

app.get('/style.css', function (req, res){
	res.sendFile(__dirname + '/style.css');
});


io.sockets.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
 

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  serialPort.write("1", function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
  var max = 100
});


function serialListener(){
  var receivedData = "";
  serialPort = new SerialPort(PORT_NAME, {
      baudrate: 38400,
      parser: serialport.parsers.readline("\n"),
      // defaults for Arduino serial communication
       dataBits: 8, 
       parity: 'none', 
       stopBits: 1, 
       flowControl: false 
  });
 
  serialPort.on("open", function () {
    console.log('open serial communication');
         // Listens to incoming data
      serialPort.on('data', function(data) { 

           receivedData = data.toString();
           // console.log(receivedData)
           // console.log("got: "+receivedData);
           // if(receivedData.indexOf("a/g") > -1){            
           //  console.log("received a/g");
           // }
           // if(receivedData.indexOf("mag") > -1){
           //  console.log("received mag");
           // }
           if(receivedData.indexOf("bar") > -1){
              var data = receivedData.split(":")[1];
              var temperature = data.split(",")[0];
              var pressure = data.split(",")[1];
              var sealevel = data.split(",")[2]
              // console.log(temperature);
              // console.log(pressure);
              // console.log(sealevel);
              var x = (new Date()).getTime(); // current time
              var tempY = temperature;//Math.floor((Math.random() * max) + 1);
              io.emit('temperature', {
                x: x,
                y: temperature
              });
              io.emit('temperatureMessage', {
                x: x,
                y: temperature
              });
              io.emit('pressure', {
                x: x,
                y: pressure
              });
              io.emit('pressureMessage', {
                x: x,
                y: pressure
              });
              io.emit('sealevel', {
                x: x,
                y: sealevel
              });
              io.emit('sealevelPressure', {
                x: x,
                y: sealevel
              });
           }

    });  
  });  
}
serialListener();