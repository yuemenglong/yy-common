var util = require("util");
var net = require("net");
var Promise = require("bluebird");

var Socket = require("./socket");
var logger = require("./logger");
var Queue = require("./queue");
var Exception = require("./exception");
var Q = require("./q");
var debug = require("./g").debug;

module.exports = Server;

function port(that) {
    return that.server.address() ?
        that.server.address().port : NaN;
}

function Server() {
    var that = this;
    this._queue = new Queue();
    this.server = net.createServer(function(socket) {
        var ret = new Socket(socket);
        that._queue.push(ret);
    });
    this.server.on("listening", function() {
        debug("[%d] Server On Listening", port(that));
    })
    this.server.on("error", function(err) {
        debug("[%d] Server On Error", port(that));
    })
    this.server.on("connection", function(socket) {
        debug("[%d, %d] Server On Connection", socket.localPort, socket.remotePort);
    })
    this.server.on("close", function() {
        debug("[%d] Server On Close", port(that));
        that.server.removeAllListeners();
    })
}

Server.prototype.listen = function(port) {
    var that = this;
    var defer = Q.defer();
    that.server.once("listening", listeningHandler);
    that.server.once("error", errorHandler);
    that.server.listen(port);
    return defer.promise.finally(removeAll);

    function listeningHandler() {
        defer.resolve();
    }

    function errorHandler(err) {
        defer.reject(err);
    }

    function removeAll() {
        that.server.removeListener("listening", listeningHandler);
        that.server.removeListener("error", errorHandler);
    }
}

Server.prototype.accept = function() {
    return this._queue.pop();
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
