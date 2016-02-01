var async = require("async");
var util = require("util");

var logger = require("./logger");
var loop = require("./loop");
var promise = require("./promise");
var Exception = require("./exception");
var Q = require("./q");

var _counter = 0;

function Task() {
    var _defer = Q.defer();
    var _cancel = false;
    var _reason = undefined;

    this._id = _counter++;

    this.id = function() {
        return this._id;
    }

    this.cancel = function(reason) {
        _cancel = true;
        _reason = reason;
    }

    this._reason = function() {
        return _reason;
    }

    this._is_cancel = function() {
        return _cancel;
    }

    this._run = function() {
        //_defer is scheduler handled and notice to user
        logger.log(util.format("Task [%d] Start", this._id));
        return promise(this.run);
        // try {
        //     var ret = this.run();
        //     return new Promise(ret);
        // } catch (ex) {
        //     logger.error(ex);
        //     return new Promise(ex);
        // }
    }
    this._succ = function(res) {
        logger.log(util.format("Task [%d] Succ", this._id));
        _defer.resolve(res);
    }
    this._fail = function(err) {
        logger.error(util.format("Task [%d] Fail", this._id));
        var ex = new Exception(err);
        _defer.reject(ex);
    }
    this._promise = function() {
        return _defer.promise;
    }
}

module.exports = Task;
