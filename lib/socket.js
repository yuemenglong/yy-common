var util = require("util");
var net = require("net");
var Promise = require("bluebird");

var logger = require("./logger");
var Exception = require("./exception");

var SOCKET_TIMEOUT_ERROR = "SOCKET_TIMEOUT_ERROR";
var SOCKET_ERROR = "SOCKET_ERROR";

module.exports = Socket;

function init(that) {
    that.buffer = "";
    that.cache = [];
    that.cacheLength = 0;
}

function Socket(socket) {
    that.socket = socket || new net.Socket({
        allowHalfOpen: true,
    });
    init(this, socket);

    var that = this;
    that.errorHandler = null;
    that.socket.on("error", function(err) {
        err = new Exception("SOCKET_ERROR", err.message);
        if (that.errorHandler) {
            that.errorHandler(err);
            that.errorHandler = null;
        } else {
            throw err;
        }
    });

    that.dataHandler = null;
    that.socket.on("data", function(data) {
        logger.debug("Data");
        that.cacheLength += data.length;
        that.cache.push(data);
        if (that.dataHandler) {
            that.dataHandler(data);
        }
    });

    that.endHandler = null;
    that.socket.on("end", function() {
        logger.debug("End");
        if (that.endHandler) {
            that.endHandler();
            that.endHandler = null;
        }
    });

    that.connectHandler = null;
    that.socket.on("connect", function() {
        logger.debug("Connect");
        if (that.connectHandler) {
            that.connectHandler();
            that.connectHandler = null;
        }
    });

    that.closeHandler = null;
    that.socket.on("close", function() {
        logger.debug("Close");
        if (that.closeHandler) {
            that.closeHandler();
            that.closeHandler = null;
        }
        that.socket.removeAllListeners();
        init(that);
    })
}

Socket.prototype.avaliable = function() {
    return this.buffer.length + this.cacheLength;
}

Socket.prototype.readBuffer = function(len) {
    if (len === undefined) {
        len = this.avaliable();
    }
    this.buffer += this.cache.join();
    this.cache = [];
    this.cacheLength = 0;
    var ret = this.buffer.slice(0, len);
    this.buffer = this.buffer.slice(len);
    return ret;
}

Socket.prototype.connect = function(host, port) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.errorHandler = reject;
        that.connectHandler = resolve;
        that.socket.connect({
            host: host,
            port: port,
        });
    })
}

Socket.prototype.write = function(data) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.errorHandler = reject;
        that.socket.write(data, function() {
            resolve();
        });
    })
}

Socket.prototype.read = function(len) {
    len = len || 1;
    var that = this;
    if (that.avaliable() >= len) {
        return Promise.resolve(that.readBuffer(len));
    }
    return new Promise(function(resolve, reject) {
        that.errorHandler = reject;
        that.dataHandler = function() {
            if (that.avaliable() >= len) {
                that.dataHandler = null;
                that.endHandler = null;
                return resolve(that.readBuffer(len));
            }
        }
        that.endHandler = function() {
            that.dataHandler = null;
            that.endHandler = null;
            return resolve(undefined);
        }
    })
}

Socket.prototype.readline = function() {
    var that = this;
    var buffer = that.readBuffer();
    var arr = buffer.split("\n");
    if (arr.length > 1) {
        var ret = arr[0]
        that.buffer = arr.slice(1).join("\n");
        return Promise.resolve(ret);
    }
    that.buffer = buffer;
    return new Promise(function(resolve, reject) {
        that.errorHandler = reject;
        that.dataHandler = function(data) {
            if (data.indexOf("\n") >= 0) {
                var buffer = that.readBuffer();
                var arr = buffer.split("\n");
                var ret = arr[0]
                that.buffer = arr.slice(1).join("\n");
                that.dataHandler = null;
                that.endHandler = null;
                return resolve(ret);
            }
        }
        that.endHandler = function() {
            that.dataHandler = null;
            that.endHandler = null;
            return resolve(undefined);
        }
    })

}

Socket.prototype.close = function() {
    // this.socket.destroy();
    this.socket.end();
}

Socket.prototype.on = function(event, cb) {
    this.socket.on(event, cb);
}

if (require.main == module) {
    var socket = new Socket();
    socket.connect("61.135.169.121", 80).then(function() {
        return socket.close();
    }).then(function() {
        return Promise.delay(100000);
    }).done();
}
