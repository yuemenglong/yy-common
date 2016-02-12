var util = require("util");
var Promise = require("bluebird");
var ws = require('ws');

var WebSocket = require("./websocket");
var logger = require("./logger");
var Queue = require("./queue");
var Exception = require("./exception");
var Q = require("./q");
var debug = require("./g").debug;

module.exports = WebServer;

function WebServer() {
    this._queue = new Queue();
    this.server = null;
}

function onEvent(that) {
    that.server.on("connection", function(socket) {
        debug("WebServer On Connection");
        var ret = new WebSocket(socket);
        that._queue.push(ret);
    })
}

WebServer.prototype.listen = function(port) {
    this.server = new ws.Server({
        port: port,
    });
    onEvent(this);
    return Promise.resolve();
}

WebServer.prototype.attach = function(server) {
    this.server = new ws.Server({
        server: server
    });
    onEvent(this);
    return Promise.resolve();
}

WebServer.prototype.accept = function() {
    return this._queue.pop();
}

WebServer.prototype.close = function() {
    this.server.close();
    return Promise.resolve();
}

if (require.main == module) {

}
