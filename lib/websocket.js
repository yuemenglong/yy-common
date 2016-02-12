var util = require("util");
var Promise = require("bluebird");
var ws = require('ws');

var logger = require("./logger");
var Exception = require("./exception");
var kit = require("./kit");
var Q = require("./q");
var Queue = require("./queue");
var debug = require("./g").debug;

var WEBSOCKET_TIMEOUT_ERROR = "WEBSOCKET_TIMEOUT_ERROR";
var WEBSOCKET_ERROR = "WEBSOCKET_ERROR";

module.exports = WebSocket;

function init(that) {
    that._queue = new Queue();
    that._close = true;
    that._timeout = 0;
}

function onEvent(that) {
    that.socket.on("error", function(err) {
        debug("On Error");
    });

    that.socket.on("message", function(data) {
        debug("On Message");
        that._queue.push(data);
    });


    that.socket.on("open", function() {
        debug("On Open");
        that._close = false;
    });

    that.socket.on("close", function() {
        debug("On Close");
        that._queue.resolve(undefined);
        that.socket.removeAllListeners();
        init(that);
    });
}

function WebSocket(socket) {
    init(this);
    socket && (this.socket = socket);
    socket && (this._close = false);
    socket && onEvent(this);
    var that = this;
}

WebSocket.prototype.connect = function(url) {
    debug("Call Connect");
    var that = this;
    var defer = Q.defer();
    this.socket = ws(url);
    onEvent(this);
    that.socket.once("error", errorHandler);
    that.socket.once("open", openHandler);
    return defer.promise.finally(removeAll);

    function errorHandler(err) {
        defer.reject(err);
    }

    function openHandler() {
        defer.resolve();
    }

    function removeAll() {
        that.socket.removeListener("error", errorHandler);
        that.socket.removeListener("open", openHandler);
    }
}

WebSocket.prototype.send = function(msg) {
    debug("Call Send");
    if (this._close) {
        return Promise.reject(new Exception(WEBSOCKET_ERROR, "Write End Socket"));
    }
    var that = this;
    var binary = msg instanceof Buffer;
    return new Promise(function(resolve, reject) {
        that.socket.send(msg, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    })
}

WebSocket.prototype.recv = function() {
    debug("Call Recv");
    if (this._close) {
        return Promise.reject(new Exception(WEBSOCKET_ERROR, "Read End Socket"));
    }
    var that = this;
    return this._queue.pop();
}

WebSocket.prototype.close = function() {
    debug("Call Close");
    var that = this;
    this.socket.close();
    var defer = Q.defer();
    this.socket.once("close", closeHandler);
    this.socket.once("error", errorHandler);
    return defer.promise.finally(removeAll);

    function closeHandler() {
        defer.resolve();
    }

    function errorHandler(err) {
        defer.reject(err);
    }

    function removeAll() {
        that.socket.removeListener("close", closeHandler);
        that.socket.removeListener("error", errorHandler);
    }
}

WebSocket.prototype.setTimeout = function(ms) {
    this._timeout = ms;
}

WebSocket.prototype.on = function(event, cb) {
    this.socket.on(event, cb);
}

WebSocket.prototype.once = function(event, cb) {
    this.socket.once(event, cb);
}

if (require.main == module) {

}
