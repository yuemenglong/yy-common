var fs = require("fs");
var path = require("path");
var util = require("util");
var crypto = require("crypto");

var logger = require("./logger");
var Exception = require("./exception");

function Kit() {

    this.mkdirSync = function(dir, mode) {
        dir = path.normalize(dir);
        var folders = dir.split(path.sep);
        var cur = undefined;
        for (var i in folders) {
            var folder = folders[i];
            if (cur) {
                cur = path.join(cur, folder);
            } else {
                cur = folder;
            }
            if (!fs.existsSync(cur)) {
                fs.mkdirSync(cur, mode);
            }
        }
        return true;
    }

    this.writeFileSync = function(file, content) {
        var dir = path.parse(file).dir;
        kit.mkdirSync(dir);
        fs.writeFileSync(file, content);
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

    this.format = function() {
        function formatNumber(num, length) {
            var value = String(num);
            if (value.length >= length) {
                return value.substr(-length, length);
            } else {
                return new Array(length - value.length + 1).join("0") + value;
            }
        }
        var args = arguments.$array();
        var fmt = args[0];
        var pos = 0;
        fmt = fmt.replace(/%(:?0\d+)?[sdj%]/, function(word) {
            pos++;
            var match = word.match(/%0(\d+)d/);
            if (match) {
                var length = parseInt(match[1]);
                args[pos] = formatNumber(args[pos], length);
                return "%s";
            } else {
                return word;
            }
        });
        args[0] = fmt;
        return util.format.apply(null, args);
    }

    this.stackInfo = function(n) {
        n = n || 0;
        // get call stack, and analyze it
        // get all file,method and line number
        var stacklist = (new Error()).stack.split('\n').slice(2 + n);
        // Stack trace format :
        // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
        // DON'T Remove the regex expresses to outside of method, there is a BUG in node.js!!!
        var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
        var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;
        var data = {};
        var s = stacklist[0];
        var sp = stackReg.exec(s) || stackReg2.exec(s);
        if (sp && sp.length === 5) {
            data.method = sp[1];
            data.path = sp[2];
            data.line = sp[3];
            data.pos = sp[4];
            data.file = path.basename(data.path);
            data.stack = stacklist.join('\n');
        }
        return data;
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
}
var kit = new Kit();
module.exports = kit;

if (require.main == module) {
    var ret = kit.array_sub([1, 2, 3, 4], [3, 4, 5]);
    logger.log(ret);
}
