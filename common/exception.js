var util = require("util");
var kit = require("./kit");

//Error     has {name, message, stack}
//Exception has {name, message, detail, stack}
function Exception(err, message, detail) {
    if (is_exception(err)) {
        return err;
    }
    if (is_exception(detail)) {
        return detail;
    }
    if (is_error(detail)) {
        return new Exception(detail);
    }
    if (is_error(err)) {
        // this.err = err.__proto__.name;
        // this.errmsg = err.message;
        // this.detail = {};
        // Object.defineProperty(this, "stack", {
        //     get: function() {
        //         return err.stack;
        //     },
        // });
        var ret = Object.create(err);
        ret.detail = {};
        return ret;
    }
    //create exception
    err = err || "UNKNOWN_ERROR";
    // err = err.toString();
    message = message || "Unknown Message";
    detail = detail || {};
    if (typeof detail !== "object") {
        detail = {
            data: detail,
        }
    }
    this.__proto__.name = err;
    this.__proto__.message = message;
    this.detail = detail;
    Error.captureStackTrace(this, Exception);
    return;
    // throw new Error("Invalid Params");
}


util.inherits(Exception, Error)
Exception.prototype.name = 'Exception';

Exception.parse = function(json) {
    var obj = JSON.parse(json);
    if (obj.err && obj.detail) {
        return new Exception(obj.err, obj.errmsg, obj.detail);
    } else {
        return undefined;
    }
}

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
