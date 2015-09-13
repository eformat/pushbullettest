/**
 * Created by admin on 12/09/15.
 */
var request = require('request');
var Promise = require('promise');


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

function listDevices(response) {
    response.forEach(function (device) {
        console.log(device.nickname, ":", device.type)
    });
}

(function () {
    getDevices(request).then(function (response) {
        response.filter(function (device) {
            return !(device.type == undefined)
        }).forEach(function (device) {
            console.log(device.nickname, ":", device.type)
        });
    }).catch(function (err) {
        console.log("Error occurred ", err);
    })
})();


//getDevices(request).done(function (response) {
//    response.forEach(function (device) {
//        console.log(device.nickname, ":", device.type)
//    });
//});





