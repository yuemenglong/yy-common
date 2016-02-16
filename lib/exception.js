var util = require("util");
var kit = require("./kit");

var errorTypeTable = {};

function Type(name) {
    if (errorTypeTable[name]) {
        return errorTypeTable[name];
    }
    var ErrorType = function(message) {
        message && (this.message = message);
    }
    ErrorType.prototype = new Error();
    ErrorType.prototype.constructor = ErrorType;
    ErrorType.prototype.name = name;
    errorTypeTable[name] = ErrorType;
    return ErrorType;
}

//Error     has {name, message, stack}
//Exception has {name, message, detail, stack}
function Exception(err, message, detail) {
    if (!err) {
        return new Error();
    }
    if (is_error(err)) {
        return err;
    }
    if (typeof err !== "string") {
        throw new Error("Invalid Err Type");
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
    return ret;
}


// util.inherits(Exception, Error)
// Exception.prototype.name = 'Exception';

Exception.format = function(ex) {
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
    return obj instanceof Error && typeof obj.detail === "object";
}

function valid(err) {
    return err === undefined || typeof err === "string";
}

module.exports = Exception;
