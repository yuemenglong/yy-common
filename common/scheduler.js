var async = require("async");
var Q = require("q");
var util = require("util");

var logger = require("./logger");
var loop = require("./loop");
var Task = require("./task");
var Promise = require("./promise");

function Scheduler(limit, sleep) {
    var _task_list = [];
    var _running_task = {};
    var _running = 0;
    var _stop = false;
    var _keep = true;
    var _defer = Q.defer();

    var limit = limit || 10000;

    this.once = function() {
        _keep = false;
        this.start();
        return _defer.promise;
    }

    this.start = function() {
        logger.log("Scheduler Start");
        loop.repeat(function() {
            if (_stop) {
                return false;
            }
            if (_running >= limit) {
                return true;
            }
            while (true) {
                var task = _task_list.shift();
                if (!task) {
                    //no more task
                    return _keep;
                }
                if (task._is_cancel()) {
                    if (!task._reason()) {
                        task._succ();
                    } else {
                        task._fail(task._reason());
                    }
                    continue;
                }
                break;
            }
            task._run().then(function(res) {
                task._succ(res);
            }).fail(function(err) {
                // logger.error(err);
                task._fail(err);
            }).done(function(res) {
                _running--;
                delete _running_task[task.id()];
                if (!_running && !_task_list.length && (!_keep || _stop)) {
                    logger.log("Scheduler Stop");
                    _defer.resolve();
                }
            });
            _running_task[task.id()] = task.dump ? task.dump() : task;
            _running++;
            return true;
        }, null, {
            sleep: sleep,
        }).done();
    }

    this.stop = function() {
        _stop = true;
        return _defer.promise;
    }

    this.exec = function(task) {
        _task_list.push(task);
        return task._promise();
    }

    this.cancel = function(task) {
        task.cancel();
    }

    this.dump = function() {
        return {
            wait: _task_list.length,
            running: _running,
            running_task: _running_task,
        }
    }
}

module.exports = Scheduler;

if (require.main == module) {

    (function() {
        var scheduler = new Scheduler();
        scheduler.start();
        var arr = [];

        function TestTask(name) {
            Task.call(this);
            this.run = function() {
                var defer = Q.defer();
                if (name == "a") {
                    throw new Error("I am Fail, I am " + name);
                }
                logger.log(name);
                arr.push(name);
                defer.resolve(name + " finish");
                return defer.promise;
            }
            this.info = function() {
                return name;
            }
        }

        for (var i = 0; i < 10; i++) {
            scheduler.exec(new TestTask(i));
        }
        scheduler.once().done(function() {
            logger.log("done");
            // assert.equal(arr.length, 10);
        });
    })();

    (function() {
        var scheduler = new Scheduler();
        scheduler.start();
        var arr = [];

        function TestTask(name) {
            Task.call(this);
            this.run = function() {
                if (name == "a") {
                    throw new Error("I am Fail, I am " + name);
                }
                logger.log(name);
                arr.push(name);
            }
        }

        for (var i = 0; i < 10; i++) {
            scheduler.exec(new TestTask(i));
        }
        scheduler.once().done(function() {
            logger.log("done");
            // assert.equal(arr.length, 10);
        });
    })();

}
