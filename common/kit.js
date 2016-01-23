var fs = require("fs");
var Q = require("q");
var util = require("util");
var crypto = require("crypto");

var logger = require("./logger");
var Exception = require("./exception");

function Kit() {

    this.date_add = function(base, add) {
        function month_code_to_num(code) {
            return {
                "JAN": 0,
                "FEB": 1,
                "MAR": 2,
                "APR": 3,
                "MAY": 4,
                "JUN": 5,
                "JUL": 6,
                "AUG": 7,
                "SEP": 8,
                "OCT": 9,
                "NOV": 10,
                "DEC": 11,
            }[code];
        }

        function month_num_to_code(num) {
            return [
                "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
            ][num];
        }

        function get_month(arg) {
            if (typeof arg == "string") {
                return month_code_to_num(arg);
            } else if (typeof arg == "number") {
                return month_num_to_code(arg);
            } else {
                return undefined;
            }
        }

        var now = new Date();
        var year = now.getYear() + 1900;
        var month = get_month(base.month) + 1;
        var day = base.day;
        if (month < now.getMonth()) {
            year += 1;
        }
        var date_str = util.format("%d/%d/%d", year, month, day);
        var usecs = (new Date(date_str)).valueOf() + add * 24 * 60 * 60 * 1000;
        var date = new Date(usecs);

        return {
            year: date.getYear() + 1900,
            month: get_month(date.getMonth()),
            day: date.getDate(),
        }
    }

    this.first_valid = function() {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== undefined) {
                return arguments[i];
            }
        }
        return undefined;
    }

    this.mkdir = function(path) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }

    this.empty = function(obj) {
        if (!obj) {
            return true;
        }
        for (var i in obj) {
            return false;
        }
        return true;
    }

    this.concat = function(a, b) {
        if (Array.isArray(a) && Array.isArray(b)) {
            return a.concat(b);
        } else if (typeof a == "object" && typeof b == "object") {
            var ret = this.copy(a);
            for (var i in b) {
                ret[i] = this.concat(ret[i], b[i]);
            }
            return ret;
        } else {
            return b;
        }
    }

    this.merge = this.concat;

    this.array_filter = function(arr) {
        arr.sort();
        var re = [arr[0]];
        for (var i = 1; i < arr.length; i++) {
            if (arr[i] !== re[re.length - 1]) {
                re.push(arr[i]);
            }
        }
        return re;
    }

    this.array_sub = function(a, b) {
        var m = {};
        for (var i in b) {
            m[b[i]] = b[i];
        }
        var ret = [];
        for (var i in a) {
            if (!m[a[i]]) {
                ret.push(a[i]);
            }
        }
        return ret;
    }

    this.format_number = function(num, length) {
        var value = String(num);
        if (value.length >= length) {
            return value.substr(-length, length);
        } else {
            return new Array(length - value.length + 1).join("0") + value;
        }
    }

    this.uid = function(obj) {
        obj = obj || "";
        if (typeof obj == "object") {
            obj = JSON.stringify(obj);
        }
        obj += Date.now();
        var md5 = crypto.createHash("md5");
        var str = JSON.stringify(obj);
        md5.update(str);
        return md5.digest("hex");
    }

    this.overload = function(of, nf) {
        return function() {
            if (arguments.length == nf.length) {
                return nf.apply(this, arguments);
            } else {
                return of.apply(this, arguments);
            }
        }
    }
}
var kit = new Kit();
module.exports = kit;

if (require.main == module) {
    var ret = kit.array_sub([1, 2, 3, 4], [3, 4, 5]);
    logger.log(ret);
}
