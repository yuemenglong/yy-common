var Q = require("./q");

var logger = require("./logger");
var Exception = require("./exception");
var promise = require("./promise");
var Promise = require("bluebird");

var LOOP_ERROR = "LOOP_ERROR";
var RETRY_MAX_TIMES_ERROR = "RETRY_MAX_TIMES_ERROR";

function safe_return() {
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined) {
            return arguments[i];
        }
    }
    return undefined;
}

function Loop() {

    this.repeat = function(func, data, sleep) {
        return _repeat(func, data);

        function _repeat(func, data) {
            var _finish = false;
            var _defer = undefined;
            var _ret = undefined;
            var _ctrl = new function() {
                this.brk = function(data) {
                    _finish = true;
                    if (_defer) {
                        _defer.resolve(data);
                    } else {
                        _ret = data;
                    }
                };
                this.cont = function(data) {
                    _finish = false;
                    if (_defer) {
                        _defer.resolve(data);
                    } else {
                        _ret = data;
                    }
                };
                this.except = function(data) {
                    _finish = true;
                    if (_defer) {
                        _defer.reject(new Exception(data));
                    } else {
                        throw new Exception(data);
                    }
                };
            }();

            return promise(function() {
                var ret = data === undefined ? func(_ctrl, _ctrl) : func(data, _ctrl);
                if (_ret !== undefined || ret !== undefined) {
                    // return _ret || ret;
                    return safe_return(_ret, ret);
                } else {
                    _defer = Q.defer();
                    return _defer.promise;
                }
            }).then(function(ret) {
                if (_finish) {
                    // ret = _ret || ret;
                    // return ret;
                    return safe_return(_ret, ret);
                } else {
                    // data = _ret || ret || data;
                    // return _next_repeat(func, data);
                    return _next_repeat(func, safe_return(_ret, ret, data));
                }
            });
        }

        function _next_repeat(func, data) {
            var defer = Q.defer();
            if (!sleep) {
                setImmediate(function() {
                    defer.resolve(_repeat(func, data));
                });
            } else {
                setTimeout(function() {
                    defer.resolve(_repeat(func, data));
                }, sleep);
            }
            return defer.promise;
        }
    }

    this.retry = function(func, times, sleep) {
        times = times || 0xffffffff;
        return _retry(func, null, 0, times, sleep);

        function _retry(func, err, cur, times, sleep) {
            if (cur >= times) {
                return Promise.reject(err);
            }
            if (cur > 0) {
                logger.warn("Retry: " + cur);
            }
            return Promise.try(func).catch(function(err) {
                if (sleep) {
                    return new Promise(function(resolve, reject) {
                        setTimeout(reject, sleep);
                    });
                } else {
                    return _retry(func, err, cur + 1, times, sleep);
                }
            });
        }
    }
};

var loop = new Loop();

module.exports = loop;

if (require.main == module) {
    var cur = 0;
    loop.retry(function(data) {
        cur++;
        if (cur > 3) {
            return data + 2;
        }
        throw data + 1;
    }, 1).done(function(data) {
        logger.log(data);
    });
}
