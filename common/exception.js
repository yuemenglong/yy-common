var util = require("util");
var kit = require("./kit");

//Error     has {name, message, stack}
//Exception has {err, errmsg, detail}
function Exception(err, errmsg, detail) {
    if (is_exception(err)) {
        return err;
    }
    if (is_exception(detail)) {
        return detail;
    }
    if (is_error(err)) {
        this.err = err.__proto__.name;
        this.errmsg = err.message;
        this.detail = {};
        this.__proto__.stack = err.stack;
    } else {
        this.err = err || "Unknown";
        this.errmsg = errmsg || "Unknown";
        if (!detail) {
            this.detail = {};
        } else if (is_error(detail)) {
            this.detail = new Exception(detail);
        } else if (typeof detail == "object") {
            this.detail = kit.copy(detail);
        } else {
            this.detail = {
                data: detail,
            }
        }
        Error.captureStackTrace(this, Exception);
    }
    this.__proto__.message = JSON.stringify(this);
}

util.inherits(Exception, Error)
Exception.prototype.name = 'Exception'

Exception.parse = function(json) {
    var obj = JSON.parse(json);
    return new Exception(obj.err, obj.errmsg, obj.detail);
}

function is_error(obj) {
    return obj instanceof Error;
}

function is_exception(obj) {
    return obj instanceof Exception;
}

module.exports = Exception;
