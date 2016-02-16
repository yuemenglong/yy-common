var Promise = require("bluebird");

var Exception = require("./exception");
var Q = require("./q");
var logger = require("./logger");

module.exports = Queue;

function Queue() {
    this.pushQueue = [];
    this.popQueue = [];
}

Queue.prototype.push = function(obj) {
    if (this.popQueue.length > 0) {
        return this.popQueue.shift().resolve(obj);
    } else {
        return this.pushQueue.push(obj);
    }
}

Queue.prototype.pop = function() {
    if (this.pushQueue.length > 0) {
        return Promise.resolve(this.pushQueue.shift());
    } else {
        var defer = Q.defer();
        this.popQueue.push(defer);
        return defer.promise;
    }
}

Queue.prototype.resolve = function(res) {
    this.popQueue.forEach(function(item) {
        item.resolve(res);
    });
    this.popQueue = [];
}

Queue.prototype.reject = function(err) {
    this.popQueue.forEach(function(item) {
        item.reject(err);
    })
    this.popQueue = [];
}
