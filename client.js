var common = require(".");
var Socket = common.Socket;
var logger = common.logger;
var Promise = require("bluebird");

var socket = new Socket();
socket.connect("61.135.169.121", 80).then(function() {
    socket.close();
}).done();
