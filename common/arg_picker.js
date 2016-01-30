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
    var args = this.args;
    var rest = nth;
    for (var i = from; i < args.length; i++) {
        var arg = args[i];
        if (typeof type === "string") {
            var belong = typeof arg === type;
        } else if (typeof type === "function") {
            var belong = arg instanceof type;
        }
        if (belong) {
            rest--;
        }
        if (rest === 0) {
            return arg;
        }
    }
    return undefined;
}

ArgPicker.prototype.rnth = function(type, nth, from) {
    var args = this.args;
    nth = nth || 1;
    from = from || 0;
    from = args.length - 1 - from;
    var rest = nth;
    for (var i = from; i >= 0; i--) {
        var arg = args[i];
        if (typeof type === "string") {
            var belong = typeof arg === type;
        } else if (typeof type === "function") {
            var belong = arg instanceof type;
        }
        if (belong) {
            rest--;
        }
        if (rest === 0) {
            return arg;
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
