// var Exception = require("./Exception");

Date.proto("format", function(fmt) {
    fmt = fmt || "yyyy-MM-dd hh:mm:ss";
    var pattern_table = {
        "y+": this.getFullYear(),
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
    }
    var replace_table = {
        "S": fmt_zero(this.getMilliseconds(), 3),
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
});

if (Date.parse === undefined) {
    Date.parse = function(str, fmt) {
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
            // throw new Exception(
            //     TIME_ERROR,
            //     "Invalid Parse Format", {
            //         str: str,
            //         fmt: fmt,
            //     }
            // )
            return undefined;
        }
        var obj = {};
        for (var i in match) {
            obj[field_list[i]] = match[i] || 0;
        }
        var ret = new Time(obj.y, obj.M - 1, obj.d, obj.h, obj.m, obj.s);
        return ret;
    }
}

function fmt_zero(num, length) {
    var value = String(num);
    if (value.length >= length) {
        return value.substr(-length, length);
    } else {
        return new Array(length - value.length + 1).join("0") + value;
    }
}

if (require.main == module) {
    console.log(new Date());
    console.log(new Date(2016, 0, 14));
}
