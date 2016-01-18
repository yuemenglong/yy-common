var Q = require("q");

var logger = require("./logger");
var Exception = require("./exception");
var Promise = require("./promise");

var LOOP_ERROR = "LOOP_ERROR";
var MAX_TIMES_ERROR = "MAX_TIMES_ERROR";

var LOOP_BREAK = "LOOP_BREAK";
var LOOP_CONTINUE = "LOOP_CONTINUE";

function LoopBreak(data) {
    var ex = new Exception(
        LOOP_BREAK
    )
    ex.data = data;
    return ex;
}

function LoopContinue(data) {
    var ex = new Exception(
        LOOP_CONTINUE
    )
    ex.data = data;
    return ex;
}

function Defer() {
    var defer = Q.defer();

    defer.brk = function(data) {
        defer.reject(new LoopBreak(data));
    }

    defer.cont = function(data) {
        defer.reject(new LoopContinue(data));
    }

    return defer;
}

function Loop() {

    this.brk = function(data) {
        throw new LoopBreak(data);
    }

    this.cont = function(data) {
        throw new LoopContinue(data);
    }

    this.defer = function() {
        return new Defer();
    }

    this.repeat = function(func, data, sleep) {
        var defer = Q.defer();
        var _cur = 0;
        _repeat(func, data);
        return defer.promise;

        function _next_repeat(func, data) {
            if (!sleep) {
                setImmediate(function() {
                    _repeat(func, data);
                });
            } else {
                setTimeout(function() {
                    _repeat(func, data);
                }, sleep);
            }
        }

        function _repeat(func, data) {
            var promise = new Promise();
            promise.then(function() {
                var ret = func(data) || data;
                return ret;
            }).then(function(data) {
                _next_repeat(func, data);
            }).fail(function(ex) {
                _ex(new Exception(ex), data);
            }).done();
        }

        function _ex(ex, data) {
            if (ex.err == LOOP_CONTINUE) {
                data = ex.data || data;
                return _next_repeat(func, data);
            } else if (ex.err == LOOP_BREAK) {
                data = ex.data || data;
                return defer.resolve(data);
            } else {
                defer.reject(ex);
            }
        }
    }

    this.retry = function(func, data, times, sleep) {
        var cur = 0;
        return loop.repeat(function(ex) {
            if (times && cur >= times) {
                throw ex;
            }
            if (cur > 0) {
                logger.log("Retry " + cur);
            }
            cur++;
            var defer = loop.defer();
            Promise.then(function() {
                return func(data);
            }).then(function(data) {
                defer.brk(data);
            }).fail(function(ex) {
                defer.cont(ex);
            }).done();
            return defer.promise;
        }, null, sleep);
    }
};

var loop = new Loop();

module.exports = loop;
