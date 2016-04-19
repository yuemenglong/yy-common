var util = require("util");
var kit = require("./kit");

var errorTypeTable = {};

function Type(name) {
    if (errorTypeTable[name]) {
        return errorTypeTable[name];
    }
    var ErrorType = function(message) {
        // message && (this.__proto__.message = message);
        message && (this.message = message);
        Object.defineProperty(this, "message", {
            enumerable: false,
        });
        // Error.call(this, message);
    }
    util.inherits(ErrorType, Error);
    ErrorType.prototype.name = name;
    errorTypeTable[name] = ErrorType;
    return ErrorType;
}

function wrap(err) {
    if (err.trace) {
        return err;
    }
    var stack = err.stack;
    var line = stack.match(/.+/g)[1];
    var info = line.match(/[^\\]+.js:\d+/);
    info && (err.trace = info[0]);
    return err;
}

//Error     has {name, message, stack}
//Exception has {name, message, detail, stack}
function Exception(err, message, detail) {
    if (!err) {
        return wrap(new Error());
    }
    if (is_error(err)) {
        return wrap(err);
    }
    if (typeof err !== "string") {
        throw new Exception("Invalid Err Type");
    }
    var ErrorType = Type(err);
    var ret = new ErrorType(message);
    if (typeof detail === "object") {
        for (var i in detail) {
            if (detail.hasOwnProperty(i)) {
                if (i === "name" || i === "message" || i === "stack") {
                    continue;
                }
                ret[i] = detail[i];
            }
        }
    } else if (detail !== undefined) {
        ret.detail = detail;
    }
    Error.captureStackTrace(ret, Exception);
    ret = wrap(ret);
    return ret;
}

// util.inherits(Exception, Error)
// Exception.prototype.name = 'Exception';

Exception.format = function(ex) {
    ex = wrap(ex);
    var ret = {
        name: ex.name,
        message: ex.message,
    }
    for (var i in ex) {
        if (ex.hasOwnProperty(i)) {
            ret[i] = ex[i];
        }
    }
    return JSON.stringify(ret);
}

Exception.parse = function(json) {
    var obj = JSON.parse(json);
    return new Exception(obj.name, obj.message, obj);
}

Exception.Type = Type;

function is_error(obj) {
    return obj instanceof Error;
}

function is_exception(obj) {
    // return obj instanceof Exception;
    return obj instanceof Error && errorTypeTable[obj.name] !== undefined;
}

function valid(err) {
    return err === undefined || typeof err === "string";
}

module.exports = Exception;
