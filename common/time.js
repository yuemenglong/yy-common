var Exception = require("./exception");

var TIME_ERROR = "TIME_ERROR";

function Time(y, M, d, h, m, s) {
    if (y instanceof Date) {
        var date = y;
    } else if (arguments.length == 1) {
        var date = new Date(y);
    } else if (arguments.length == 0) {
        var date = new Date();
    } else if (arguments.length == 3) {
        var date = new Date(y, M - 1, d);
    } else if (arguments.length == 6) {
        var date = new Date(y, M - 1, d, h, m, s);
    }

    date.toString = function() {
        return Time.format(date);
    }

    date.format = function(fmt) {
        return Time.format(date, fmt);
    }

    // this.__proto__ = date;

    return date;
}

function fmt_zero(num, length) {
    var value = String(num);
    if (value.length >= length) {
        return value.substr(-length, length);
    } else {
        return new Array(length - value.length + 1).join("0") + value;
    }
}

Time.format = function(date, fmt) {
    fmt = fmt || "yyyy-MM-dd hh:mm:ss";
    var pattern_table = {
        "y+": date.getFullYear(),
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "h+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
    }
    var replace_table = {
        "S": fmt_zero(date.getMilliseconds(), 3),
    }

    for (var i in pattern_table) {
        fmt = fmt.replace(new RegExp(i), function(word) {
            return fmt_zero(pattern_table[i], word.length);
        });
    }
    for (var i in replace_table) {
        fmt = fmt.replace(new RegExp(i), function(word) {
            return replace_table[i];
        });
    }
    return fmt;
}

Time.parse = function(str, fmt) {
    if (!str) {
        return;
    }
    fmt = fmt || "yyyy-MM-dd hh:mm:ss";
    var pattern_table = {
        "y+": "y",
        "M+": "M",
        "d+": "d",
        "h+": "h",
        "m+": "m",
        "s+": "s",
    }
    var replace_table = {
        "S": "S",
    }

    var pattern = [];
    for (var i in pattern_table) {
        pattern.push(i);
    }
    pattern = "(" + pattern.join(")|(") + ")";

    var field_list = ["ALL"];
    pattern = fmt.replace(new RegExp(pattern, "g"), function(word) {
        field_list.push(word[0]);
        return "(" + new Array(word.length + 1).join("\\d") + ")";
    });

    var match = str.match(pattern);
    if (!match) {
        throw new Exception(
            TIME_ERROR,
            "Invalid Parse Format", {
                str: str,
                fmt: fmt,
            }
        )
    }
    var obj = {};
    for (var i in match) {
        obj[field_list[i]] = match[i] || 0;
    }
    var ret = new Time(obj.y, obj.M, obj.d, obj.h, obj.m, obj.s);
    return ret;
}

module.exports = Time;

if (require.main == module) {
    console.log(new Date());
    console.log(new Date(2016, 0, 14));
}
