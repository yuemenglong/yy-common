var Q = require("q");
var logger = require("./logger");
var Exception = require("./exception");

function is_real_promise(obj) {
    if (!obj) {
        return false;
    }
    return typeof obj.then == "function" &&
        typeof obj.fail == "function" &&
        typeof obj.done == "function";
}

function Promise(ret) {
    if (ret instanceof Promise) {
        return ret;
    }
    if (is_real_promise(ret)) {
        return ret;
    }
    if (ret instanceof Error) {
        ret = new Exception(ret);
        var _err = true;
    }
    this.then = function(cb) {
        if (_err) {
            return this;
        } else {
            try {
                var res = cb(ret);
                return new Promise(res);
            } catch (err) {
                return new Promise(new Exception(err));
            }
        }
    }
    this.fail = function(cb) {
        if (_err) {
            try {
                var res = cb(ret);
                return new Promise(res);
            } catch (err) {
                return new Promise(new Exception(err));
            }
        } else {
            return this;
        }
    }
    this.done = function(cb) {
        if (_err) {
            throw ret;
        } else if (cb) {
            cb(ret);
        }
    }
}

Promise.then = function(func) {
    var promise = new Promise();
    return promise.then(func);
}

module.exports = Promise;

if (require.main == module) {

}
