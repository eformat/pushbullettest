/**
 * Created by admin on 12/09/15.
 */
var request = require('request');


var request = request.defaults({
    auth: {
        username: process.argv[2],
        password: ''
    },
    json: true
});


var getDevices = function(request, callback) {
    request.get('https://api.pushbullet.com/v2/devices', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, body.devices);
        } else {
            callback(error);
        }
    })
};

getDevices(request, function (error, response) {
    if (error) {
        console.log(error);
    } else {
        response.forEach(function(device){console.log(device.nickname,":",device.type)});
    }
});




