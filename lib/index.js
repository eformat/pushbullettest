/**
 * Created by admin on 12/09/15.
 */
var request = require('request');
var Promise = require('promise');
var EventEmitter = require("events").EventEmitter;
var WebSocketClient = require('websocket').client;


var request = request.defaults({
    auth: {
        username: process.argv[2],
        password: ''
    },
    json: true
});

var ee = new EventEmitter();

function getDevices(request) {
    return new Promise(function (fulfill, reject) {
        request.get('https://api.pushbullet.com/v2/devices', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                fulfill(body.devices);
            } else {
                reject(new Error("Error response received " + response.statusCode));
            }
        })
    })
}


ee.on("WSStart", function () {
    var devArray = [];

    getDevices(request).then(function (response) {
        devArray = response.filter(function (device) {
            return (device.nickname == "downloadDevice")
        });
        if (devArray.length == 1) {
            ee.emit('DLDeviceFound', devArray[0]);
        } else {
            ee.emit('DLDeviceNotFound');
        }
    }).catch(function (err) {
        console.log("Error occurred ", err);
    });
});

ee.on('DLDeviceFound', function (device) {
    console.log('Download devices found ', JSON.stringify(device));
    client.connect('wss://stream.pushbullet.com/websocket/'+process.argv[2]);
});


ee.on('GetPush', function () {
    console.log('Go get push.....');
});

ee.on('DLDeviceNotFound', function () {
    console.log('No Download devices found....Creating');
    var options = {
        json: {
            nickname: 'downloadDevice',
            type: 'stream'
        }
    };
    request.post('https://api.pushbullet.com/v2/devices', options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('Download devices created');
            ee.emit("WSStart");
        } else {
            console.log('Failed to create download devices created');
        }
    });
});


var client = new WebSocketClient();

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function () {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
            var msgRecv = JSON.parse(message.utf8Data);
            if (msgRecv.subtype == "push"){
                ee.emit("GetPush");
            }
        }
    });

});



ee.emit("WSStart");











