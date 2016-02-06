var util = require("util");
var Promise = require("bluebird");
var Q = require("./q");

var logger = require("./logger");

function Scheduler(limit, sleep) {
    this.tasks = [];
    this.running = 0;
    this.limit = limit || 0xFFFFFFFF;
    this.sleep = sleep || 0;
    this.active = false;
    this.defer = Q.defer();
}

Scheduler.prototype.exec = function(fn) {
    var that = this;
    var defer = Q.defer();
    var task = {
        fn: fn,
        resolve: defer.resolve,
        reject: defer.reject,
        promise: defer.promise,
    }
    that.tasks.push(task);
    return defer.promise;
}

function exec(scheduler, task) {
    scheduler.running++;
    return Promise.try(function() {
        return task.fn();
    }).finally(function() {
        scheduler.running--;
    }).then(function(res) {
        task.resolve(res);
    }).catch(function(err) {
        task.reject(err);
    }).done();
}
Scheduler.prototype.once = function() {
    var that = this;

    function sched() {
        if (that.tasks.length === 0 && that.running === 0) {
            return Promise.resolve();
        }
        if (that.running >= that.limit) {
            return Promise.delay(that.sleep).then(sched);
        }
        var task = that.tasks.shift();
        if (task) {
            exec(that, task);
        }
        return Promise.delay(that.sleep).then(sched);
    }
    return sched();
}
Scheduler.prototype.start = function() {
    this.active = true;
    var that = this;

    function sched() {
        if (!that.active && that.tasks.length === 0 && that.running === 0) {
            return that.defer.resolve();
        }
        if (that.running >= that.limit) {
            return Promise.delay(that.sleep).then(sched);
        }
        var task = that.tasks.shift();
        if (task) {
            exec(that, task);
        }
        return Promise.delay(that.sleep).then(sched);
    }
    sched().done();
}

Scheduler.prototype.stop = function() {
    this.active = false;
    return this.defer.promise;
}

module.exports = Scheduler;

if (require.main == module) {

}
