/**
 * Created by admin on 12/09/15.
 */
var request = require('request');
var Promise = require('promise');
var EventEmitter = require("events").EventEmitter;
var WebSocketClient = require('websocket').client;
var bunyan = require('bunyan');

var log = bunyan.createLogger({name: "PBDownloader"});
var client = new WebSocketClient();
var ee = new EventEmitter();


var request = request.defaults({
    auth: {
        username: process.argv[2],
        password: ''
    },
    json: true
});



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

function getPushes(request, timestamp) {
    console.log(JSON.stringify(request), timestamp);
    return new Promise(function (fulfill, reject) {
        request.get('https://api.pushbullet.com/v2/pushes?modified_after=' + timestamp, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                fulfill(body);
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
        log.error("Error occurred ", err);
    });
});

ee.on('DLDeviceFound', function (device) {
    log.info('Download devices found ', JSON.stringify(device));
    client.connect('wss://stream.pushbullet.com/websocket/' + process.argv[2]);
});

ee.on('DLLink', function (dlurl) {
    log.info(dlurl);
});


ee.on('GetPush', function () {
    log.info('Retrieving push')
    getPushes(request, (new Date().getTime() / 1000) - 1).then(function (response) {
        ee.emit("DLLink", response.pushes[0].url);
    }).catch(function (err) {
        log.error("Error occurred ", err);
    });
});

ee.on('DLDeviceNotFound', function () {
    log.warn('No Download devices found....Creating');
    var options = {
        json: {
            nickname: 'downloadDevice',
            type: 'stream'
        }
    };
    request.post('https://api.pushbullet.com/v2/devices', options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            log.debug('Download devices created');
            ee.emit("WSStart");
        } else {
            log.error('Failed to create download devices created');
        }
    });
});

client.on('connectFailed', function (error) {
    log.error('PB WSS Connect Failed: ' + error.toString());
});

client.on('connect', function (connection) {
    log.info('WebSocket Client Connected');
    connection.on('error', function (error) {
        log.error("PB Connection Error: " + error.toString());
    });
    connection.on('close', function () {
        log.error('PB Connection Closed');
    });
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            log.debug("Received: '" + message.utf8Data + "'");
            var msgRecv = JSON.parse(message.utf8Data);
            if (msgRecv.subtype == "push") {
                ee.emit("GetPush");
            }
        }
    });

});

ee.emit("WSStart");