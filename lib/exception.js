var util = require("util");
var _ = require("lodash");

var errorTypeTable = {};

function Type(name) {
    if (errorTypeTable[name]) {
        return errorTypeTable[name];
    }
    var ErrorType = function(message) {
        message && (this.message = message);
        Object.defineProperty(this, "message", {
            enumerable: false,
        });
    }
    util.inherits(ErrorType, Error);
    ErrorType.prototype.name = name;
    errorTypeTable[name] = ErrorType;
    return ErrorType;
}

function toJSON() {
    var clone = {
        name: this.name,
        message: this.message,
    };
    clone = _.merge(clone, this);
    // return JSON.stringify(clone);
    return clone;
}

function wrap(err) {
    if (err.trace) {
        return err;
    }
    var stack = err.stack;
    var line = stack.match(/.+/g)[1];
    var info = line.match(/[^\\(]+.js:\d+/);
    info && (err.trace = info[0]);
    err.toJSON = toJSON;
    Object.defineProperty(err, "toJSON", {
        enumerable: false,
    });
    // Object.getPrototype(err).toJSON = toJSON;
    return err;
}

//Exception has {name, message, stack, trace}
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

Exception.format = function(ex) {
    ex = wrap(ex);
    return JSON.stringify(ex);
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
