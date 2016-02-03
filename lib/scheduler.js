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

Scheduler.prototype.loop = function() {
    var that = this;
    if (that.active === false) {
        return Promise.resolve();
    }
    var task = that.tasks.shift();
    if (task !== undefined && that.running < that.limit) {
        that._exec_task(task);
    }
    return Promise.delay(that.sleep).then(function() {
        return that.loop();
    });
}
Scheduler.prototype._exec_task = function(task) {
    var that = this;
    that.running++;
    Promise.try(function() {
        return task.fn();
    }).finally(function() {
        that.running--;
    }).then(function(res) {
        task.resolve(res);
    }).catch(function(err) {
        task.reject(err);
    }).done();
}
Scheduler.prototype.once = function() {
    var that = this;
    that.active = true;
    var last = null;

    function sched() {
        if (!that.active) {
            return Promise.resolve();
        }
        if (that.running >= that.limit) {
            return Promise.delay(that.sleep).then(sched);
        }
        var task = that.tasks.shift();
        if (task === undefined) {
            return Promise.resolve();
        }
        last = task;
        that._exec_task(task);
        return Promise.delay(that.sleep).then(sched);
    }
    return sched().then(function() {
        if (!last) {
            return;
        }
        return last.promise;
    });
}
Scheduler.prototype.start = function() {
    this.active = true;
    var that = this;
    that.loop().done();
}

Scheduler.prototype.stop = function() {
    this.active = false;
}

module.exports = Scheduler;

if (require.main == module) {

}
