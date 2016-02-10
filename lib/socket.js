var util = require("util");
var net = require("net");
var Promise = require("bluebird");

var logger = require("./logger");
var Exception = require("./exception");
var kit = require("./kit");
var Q = require("./q");

var SOCKET_TIMEOUT_ERROR = "SOCKET_TIMEOUT_ERROR";
var SOCKET_ERROR = "SOCKET_ERROR";

module.exports = Socket;

function debug() {
    logger.debug.apply(logger, arguments);
}

function init(that) {
    that._buffer = "";
    that._cache = [];
    that._cacheLength = 0;
    that._end = true;
}

function Socket(socket) {
    init(this);
    this._end = socket === undefined;
    this._id = kit.uid().substr(0, 4).toUpperCase();
    this.socket = socket || new net.Socket();
    var that = this;

    that.socket.on("error", function(err) {
        debug("[%d, %d] On Error", that.socket.localPort, that.socket.remotePort);
    });

    that.socket.on("data", function(data) {
        debug("[%d, %d] On Data", that.socket.localPort, that.socket.remotePort);
        that._cacheLength += data.length;
        that._cache.push(data);
    });

    that.socket.on("drain", function() {
        debug("[%d, %d] On Drain", that.socket.localPort, that.socket.remotePort);
    });

    that.socket.on("end", function() {
        debug("[%d, %d] On End", that.socket.localPort, that.socket.remotePort);
        that._end = true;
    });

    that.socket.on("connect", function() {
        debug("[%d, %d] On Connect", that.socket.localPort, that.socket.remotePort);
        that._end = false;
    });

    that.socket.on("close", function() {
        debug("[%d, %d] On Close", that.socket.localPort, that.socket.remotePort);
        that.socket.removeAllListeners();
        init(that);
    });
}

Socket.prototype.avaliable = function() {
    return this._buffer.length + this._cacheLength;
}

Socket.prototype.connect = function(host, port) {
    debug("[%d, %d] Call Connect", this.socket.localPort, this.socket.remotePort);
    var that = this;
    var defer = Q.defer();
    that.socket.once("error", errorHandler);
    that.socket.once("connect", connectHandler);
    that.socket.connect({
        host: host,
        port: port,
    });
    return defer.promise.finally(removeAll);

    function errorHandler(err) {
        defer.reject(err);
    }

    function connectHandler() {
        defer.resolve();
    }

    function removeAll() {
        that.socket.removeListener("error", errorHandler);
        that.socket.removeListener("connect", connectHandler);
    }
}

Socket.prototype.write = function(data) {
    debug("[%d, %d] Call Write", this.socket.localPort, this.socket.remotePort);
    if (this._end) {
        return Promise.reject(new exception(SOCKET_ERROR, "Write End Socket"));
    }
    var that = this;
    var defer = Q.defer();
    that.socket.on("drain", drainHandler);
    that.socket.on("error", errorHandler);
    var ret = that.socket.write(data);
    if (ret === true ) {
        debug("[%d, %d] Write Immediate", this.socket.localPort, this.socket.remotePort);
        defer.resolve();
    }
    return defer.promise.finally(removeAll);

    function errorHandler(err) {
        defer.reject(err);
    }

    function drainHandler() {
        defer.resolve();
    }

    function removeAll() {
        that.socket.removeListener("drain", drainHandler);
        that.socket.removeListener("error", errorHandler);
    }
}

function readline(that) {
    var buffer = that.buffer();
    if (buffer.indexOf("\n") < 0) {
        return undefined;
    }
    var arr = buffer.split("\n");
    var ret = arr[0];
    that._buffer = arr.slice(1).join("\n");
    return ret;
}

Socket.prototype.peek = function(len) {
    var buffer = this.buffer();
    var ret = buffer.slice(0, len);
    this._buffer = buffer.slice(len);
    return ret;
}

Socket.prototype.buffer = function() {
    if (this._cacheLength === 0) {
        return this._buffer;
    }
    this._buffer += this._cache.join("");
    this._cache = [];
    this._cacheLength = 0;
    return this._buffer;
}

Socket.prototype.readline = function() {
    debug("[%d, %d] Call Readline", this.socket.localPort, this.socket.remotePort);
    if (this._end) {
        return Promise.resolve(undefined);
    }
    var that = this;
    var ret = readline(that);
    if (ret) {
        return Promise.resolve(ret);
    }
    var defer = Q.defer();
    that.socket.on("data", dataHandler);
    that.socket.once("end", endHandler);
    that.socket.once("close", closeHandler);
    that.socket.once("error", errorHandler);
    return defer.promise.finally(removeAll);

    function dataHandler(data) {
        if (data.indexOf("\n") >= 0) {
            var ret = readline(that);
            defer.resolve(ret);
        }
    }

    function endHandler() {
        defer.resolve(undefined);
    }

    function closeHandler() {
        defer.resolve(undefined);
    }

    function errorHandler(err) {
        defer.reject(err);
    }

    function removeAll() {
        that.socket.removeListener("data", dataHandler);
        that.socket.removeListener("end", endHandler);
        that.socket.removeListener("close", closeHandler);
        that.socket.removeListener("error", errorHandler);
    }
}

Socket.prototype.read = function(len) {
    debug("[%d, %d] Call Read", this.socket.localPort, this.socket.remotePort);
    if (this._end) {
        // return Promise.resolve(undefined);
        return Promise.reject(new Exception(SOCKET_ERROR, "Read End Socket"));
    }
    len = len || 1;
    var that = this;
    if (that.avaliable() >= len) {
        return Promise.resolve(that.peek(len));
    }
    var defer = Q.defer();
    that.socket.on("data", dataHandler);
    that.socket.once("end", endHandler);
    that.socket.once("close", closeHandler);
    that.socket.once("error", errorHandler);
    return defer.promise.finally(removeAll);

    function dataHandler(data) {
        if (that.avaliable() >= len) {
            defer.resolve(that.peek(len));
        }
    }

    function endHandler() {
        defer.resolve(undefined);
    }

    function closeHandler() {
        defer.resolve(undefined)
    }

    function errorHandler(err) {
        defer.reject(err);
    }

    function removeAll() {
        that.socket.removeListener("data", dataHandler);
        that.socket.removeListener("end", endHandler);
        that.socket.removeListener("close", closeHandler);
        that.socket.removeListener("error", errorHandler);
    }
}

Socket.prototype.close = function() {
    debug("[%d, %d] Call Close", this.socket.localPort, this.socket.remotePort);
    var that = this;
    this.socket.destroy();
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

Socket.prototype.on = function(event, cb) {
    this.socket.on(event, cb);
}

Socket.prototype.once = function(event, cb) {
    this.socket.once(event, cb);
}

if (require.main == module) {

}
