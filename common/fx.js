require("./proto.all");
var Q = require("./q");

exports.deferize = function(func, pattern) {
    if (typeof func !== "function") {
        return func;
    }
    if (func.$deferize === true) {
        return func;
    }
    pattern = pattern || /(^cb)|(^callback)/;
    var last_arg = func.$args().slice(-1)[0];
    if (!pattern.test(last_arg)) {
        return func;
    }
    // if (last_arg.indexOf("cb") != 0 &&
    //     last_arg.indexOf("callback") != 0) {
    //     return func;
    // }
    var ret = function() {
        if (arguments.length >= func.length ||
            typeof arguments[arguments.length - 1] === "function") {
            return func.apply(this, arguments);
        }
        var defer = Q.defer();
        var args = [];
        var i = 0;
        for (; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (; i < func.length - 1; i++) {
            args.push(undefined);
        }
        args.push(cb);
        func.apply(this, args);
        return defer.promise;

        function cb() {
            if (arguments[0]) {
                defer.reject(arguments[0]);
            } else {
                defer.resolve(arguments[1]);
            }
        }
    }
    Object.defineProperty(ret, "$deferize", {
        value: true,
    })
    return ret;
}

exports.overload = function(of, nf) {
    return function() {
        if (arguments.length == nf.length) {
            return nf.apply(this, arguments);
        } else {
            return of.apply(this, arguments);
        }
    }
}

exports.decorate = function(orig, decor) {
    return function() {
        var args = arguments.$array();
        for (var i = args.length; i < decor.length - 1; i++) {
            args.push(undefined);
        }
        $orig = orig.bind(this);
        args.push($orig);
        return decor.apply(this, args);
    }
}
