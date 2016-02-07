var util = require("util");
var net = require("net");
var Promise = require("bluebird");

var Socket = require("./socket");
var logger = require("./logger");
var Queue = require("./queue");
var Exception = require("./exception");

module.exports = Server;

function Server() {
    var that = this;
    this.queue = new Queue();
    this.server = net.createServer({
        allowHalfOpen: true,
    }, function(socket) {
        logger.debug("Connection");
        that.queue.push(new Socket(socket));
    });
}

Server.prototype.listen = function(port) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.server.listen(port, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    })
}

Server.prototype.accept = function() {
    return this.queue.pop();
}

Server.prototype.close = function() {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.server.close(function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

if (require.main == module) {

}
