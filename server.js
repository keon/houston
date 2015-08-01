var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var serialport = require("serialport");

var SerialPort = serialport.SerialPort; // localize object constructor


var PORT_NAME = 'COM8';


var cleanData = ''; // this stores the clean data
var readData = '';  // this stores the buffer

server.listen(3000);
console.log("listening to port 3000");

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/jquery.js', function (req, res){
  res.sendFile(__dirname + '/resources/jquery.js');
});

app.get('/socketio.js', function (req, res){
  res.sendFile(__dirname + '/resources/socketio.js');
});

app.get('/bootstrap.js', function (req, res){
  res.sendFile(__dirname + '/resources/bootstrap.js');
});

app.get('/highcharts.js', function (req, res){
  res.sendFile(__dirname + '/resources/highcharts.js');
});

app.get('/exporting.js', function (req, res){
  res.sendFile(__dirname + '/resources/exporting.js');
});

app.get('/bootstrap.css', function (req, res){
  res.sendFile(__dirname + '/resources/bootstrap.css');
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

  socket.on('parachute1', function(){
    serialPort.write("0", function(err, results) {
      console.log('err ' + err);
      console.log('results ' + results);
    });
  });

  socket.on('parachute2', function(){
    serialPort.write("2", function(err, results) {
      console.log('err ' + err);
      console.log('results ' + results);
    });
  });

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
      serialPort.on('data', function(data) { 
           receivedData = data.toString();
           console.log(receivedData);

           var x = (new Date()).getTime(); // current time
           if(receivedData.indexOf("mag")>-1){
              var data = receivedData.split(":")[1];
              fs.appendFile('./maglog.txt', (new Date(x))+"," + data, function (err) {
                  if (err) throw err;
                  // console.log("logged")
              });
           }
           // console.log(receivedData);
           if(receivedData.indexOf("a/g") > -1){
              var x = (new Date()).getTime(); // current time      
              var data = receivedData.split(":")[1];
              var ax = data.split(",")[0]
              var ay = data.split(",")[1]
              var az = data.split(",")[2]
              // var gx = data.split(",")[3]
              // var gy = data.split(",")[4]
              // var gz = data.split(",")[5]

              fs.appendFile('./aglog.txt', (new Date(x))+","+data, function (err) {
                  if (err) throw err;
                  console.log("logged")
              });
              io.emit('accel', {
                x: x,
                ax: ax,
                ay: ay,
                az: az
              });
           }
           if(receivedData.indexOf("bar") > -1){
              var data = receivedData.split(":")[1];
              var temperature = data.split(",")[0];
              var pressure = data.split(",")[1];
              var sealevel = data.split(",")[2]
              // console.log("TEMPERATURE", temperature);
              // console.log("PRESSURE", pressure);
              // console.log("SEALEVEL", sealevel);
              var originalSealevel = 1011;
              var altitude = 44330 * (1-(Math.pow((sealevel/originalSealevel), (1/5.255))))
              
              fs.appendFile('./tpsalog.txt',(new Date(x))+","+ data, function (err) {
                  if (err) throw err;
                  console.log("logged")
              });
              io.emit('tpsa', {
                x: x,
                temperature: temperature,
                pressure: pressure,
                sealevel: sealevel,
                altitude: altitude
              });
           }

           if(receivedData.indexOf("state") > -1){
            var data = receivedData.split(":")[1];
            fs.appendFile('./state.txt',(new Date(x))+","+ data, function (err) {
                  if (err) throw err;
                  console.log("logged")
            });
            io.emit("state", {
              parachute: data
            });
           }

    });  
  });  
}
serialListener();