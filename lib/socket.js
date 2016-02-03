var util = require("util");
var net = require("net");
var Promise = require("bluebird");

var logger = require("./logger");
var Exception = require("./exception");

var SOCKET_ERROR = "SOCKET_ERROR";
var SOCKET_TIMEOUT_ERROR = "SOCKET_TIMEOUT_ERROR";

module.exports = Socket;

function Socket(socket) {
    this.socket = socket || new net.Socket();
    this.buffer = "";
    this.cache = [];
    this.cacheLength = 0;
    this.active = false;

    var that = this;
    that.errorHandler = null;
    that.socket.on("error", function(err) {
        that.active = false;
        if (that.errorHandler) {
            that.errorHandler(err);
            that.errorHandler = null;
        } else {
            throw err;
        }
    });

    that.dataHandler = null;
    that.socket.on("data", function(data) {
        that.cacheLength += data.length;
        that.cache.push(data);
        if (that.dataHandler) {
            that.dataHandler(data);
        }
    });

    that.endHandler = null;
    that.socket.on("end", function() {
        that.active = false;
        if (that.endHandler) {
            that.endHandler();
            that.endHandler = null;
        }
    });

    that.connectHandler = null;
    that.socket.on("connect", function() {
        that.active = true;
        if (that.connectHandler) {
            that.connectHandler();
            that.connectHandler = null;
        }
    });

    that.closeHandler = null;
    that.socket.on("close", function() {
        that.active = false;
        if (that.closeHandler) {
            that.closeHandler();
            that.closeHandler = null;
        }
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
    if (this.active) {
        return Promise.reject(new Exception(SOCKET_ERROR, "Already Active"));
    }
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
    if (!this.active) {
        return Promise.reject(new Exception(SOCKET_ERROR, "Not Active"));
    }
    var that = this;
    return new Promise(function(resolve, reject) {
        that.errorHandler = reject;
        that.socket.write(data, function() {
            resolve();
        });
    })
}

Socket.prototype.read = function(len) {
    if (!this.active) {
        return Promise.reject(new Exception(SOCKET_ERROR, "Not Active"));
    }
    var that = this;
    if (that.avaliable() >= len) {
        return Promise.resolve(that.readBuffer(len));
    }
    return new Promise(function(resolve, reject) {
        that.errorHandler = reject;
        that.dataHandler = function() {
            if (that.avaliable() >= len) {
                that.dataHandler = null;
                return resolve(that.readBuffer(len));
            }
        }
    })
}

Socket.prototype.readline = function() {
    if (!this.active) {
        return Promise.reject(new Exception(SOCKET_ERROR, "Not Active"));
    }
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
                return resolve(ret);
            }
        }
    })

}

Socket.prototype.close = function() {
    this.active = false;
    this.socket.destroy();
}

Socket.prototype.on = function(event, cb) {
    this.socket.on(event, cb);
}

if (require.main == module) {

}
