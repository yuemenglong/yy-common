var common = require(".");
var Socket = common.Socket;
var logger = common.logger;
var Promise = require("bluebird");

var socket = new Socket();
socket.connect("localhost", 80).then(function() {
    socket.close();
}).then(function() {
	logger.log(1);
    return Promise.delay(3000);
}).then(function() {
	logger.log(2);
    return socket.read(1);
}).then(function() {
	logger.log(3);
    return Promise.delay(1000000);
}).catch(function(err) {
	logger.log(4);
    logger.log(err);
}).then(function() {
	logger.log(5);
	
}).done();
