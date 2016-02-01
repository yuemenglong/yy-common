var logger = require("./logger");

function ArgPicker(args) {
    this.args = args;
}

module.exports = ArgPicker;

ArgPicker.prototype.first = function(type, from) {
    return this.nth(type, 1, from);
}

ArgPicker.prototype.second = function(type, from) {
    return this.nth(type, 2, from);
}

ArgPicker.prototype.nth = function(type, nth, from) {
    nth = nth || 1;
    from = from || 0;
    type = Array.isArray(type) ? type : [type];
    var args = this.args;
    var rest = nth;
    for (var i = from; i < args.length; i++) {
        var arg = args[i];
        for (var j in type) {
            var t = type[j];
            if (t === "array") {
                var belong = Array.isArray(arg);
            } else if (typeof t === "string") {
                var belong = typeof arg === t;
            } else if (typeof t === "function") {
                var belong = arg instanceof t;
            }
            if (belong) {
                rest--;
                if (rest === 0) {
                    return arg;
                } else {
                    break;
                }
            }
        }
    }
    return undefined;
}

ArgPicker.prototype.rnth = function(type, nth, from) {
    var args = this.args;
    nth = nth || 1;
    from = from || 0;
    from = args.length - 1 - from;
    type = Array.isArray(type) ? type : [type];
    var rest = nth;
    for (var i = from; i >= 0; i--) {
        var arg = args[i];
        for (var j in type) {
            var t = type[j];
            if (t === "array") {
                var belong = Array.isArray(arg);
            } else if (typeof t === "string") {
                var belong = typeof arg === t;
            } else if (typeof t === "function") {
                var belong = arg instanceof t;
            }
            if (belong) {
                rest--;
                if (rest === 0) {
                    return arg;
                } else {
                    break;
                }
            }
        }
    }
    return undefined;
}

ArgPicker.prototype.rfirst = function(type, from) {
    return this.rnth(type, 1, from);
}

ArgPicker.prototype.rsecond = function(type, from) {
    return this.rnth(type, 2, from);
}
