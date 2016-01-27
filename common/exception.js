var util = require("util");
var kit = require("./kit");

//Error     has {name, message, stack}
//Exception has {name, message, detail, stack}
function Exception(err, message, detail) {
    if (is_error(err)) {
        return err;
    }
    //create exception
    err = err || "UNKNOWN_ERROR";
    message = message || "Unknown Message";
    this.__proto__ = new Error(message);
    this.__proto__.name = err;
    // this.__proto__.message = message;
    if (typeof detail === "object") {
        for (var i in detail) {
            if (detail.hasOwnProperty(i)) {
                if (i === "name" || i === "message" || i === "stack") {
                    continue;
                }
                this[i] = detail[i];
            }
        }
    } else if (detail !== undefined) {
        this.detail = detail;
    }
    Error.captureStackTrace(this, Exception);
}


// util.inherits(Exception, Error)
// Exception.prototype.name = 'Exception';

Exception.prototype.format = function() {
    var ret = {
        name: this.name,
        message: this.message,
    }
    for (var i in this) {
        if (this.hasOwnProperty(i)) {
            ret[i] = this[i];
        }
    }
    return JSON.stringify(ret);
}

Exception.parse = function(json) {
    var obj = JSON.parse(json);
    return new Exception(obj.name, obj.message, obj);
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
