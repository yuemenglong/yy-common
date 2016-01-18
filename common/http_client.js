var http = require("http");
var https = require("https");
var URL = require("url");
var querystring = require("querystring");
var Q = require("q");
var util = require("util");
var iconv = require('iconv-lite');

var Exception = require("./exception");

var HTTP_ERROR = "HTTP_ERROR";
var HTTP_TIMEOUT_ERROR = "HTTP_TIMEOUT_ERROR";

function HttpClient() {
    var _cookie = {};
    var _timeout = 0;
    var _charset = "utf8";

    function cookie_string() {
        var arr = [];
        for (var i in _cookie) {
            arr.push(util.format("%s=%s", i, _cookie[i]));
        }
        var cookie = arr.join("; ");
        return cookie;
    }

    function handle_set_cookie(headers) {
        var cookies = headers["set-cookie"];
        var regex = /(.+?)=(.+?);.+/;
        for (var i in cookies) {
            var match = cookies[i].match(regex);
            _cookie[match[1]] = match[2];
        }
    }

    function set_cookie(headers) {
        if (headers["Cookie"]) {
            return;
        }
        var cookie = cookie_string();
        if (!cookie.length) {
            return;
        }
        headers["Cookie"] = cookie;
    }

    function defered(defer, req, res) {
        handle_set_cookie(res.headers);
        // var ret = "";
        var buffer = [];
        res.on("data", function(data) {
            // ret += data;
            buffer.push(data);
        }).on("end", function() {
            var raw = Buffer.concat(buffer);
            var ret = iconv.decode(raw, _charset);
            defer.resolve({
                "statusCode": res.statusCode,
                "statusMessage": res.statusMessage,
                "headers": res.headers,
                "data": ret,
                "body": ret,
                "raw": raw,
            });
        }).on("error", function(err) {
            defer.reject(new Exception(
                HTTP_ERROR,
                "Http Response Error",
                err
            ));
        });
    }

    function request(parsed, opt, content) {
        var defer = Q.defer();
        set_cookie(opt.headers);
        var req = undefined;
        var res_ = undefined;
        if (parsed.protocol == "https:") {
            opt.port = parsed.port || 443;
            req = https.request(opt, function(res) {
                res_ = res;
                defered(defer, req, res);
            });
        } else if (parsed.protocol == "http:") {
            opt.port = parsed.port || 80;
            req = http.request(opt, function(res) {
                res_ = res;
                defered(defer, req, res);
            });
        } else {
            throw "Invalid Protocol";
        }
        if (opt.method == "POST") {
            req.write(content);
        }
        req.end();
        req.on("error", function(err) {
            defer.reject(new Exception(
                HTTP_ERROR,
                "Http Request Error",
                err
            ));
        });
        if (_timeout) {
            req.setTimeout(_timeout, function() {
                if (res_ && res_.finished) {
                    return;
                }
                req.abort();
                defer.reject(new Exception(
                    HTTP_TIMEOUT_ERROR,
                    "Http Request Timeout",
                    _timeout
                ));
            });
        }
        return defer.promise;
    }

    this.set_timeout = function(timeout) {
        _timeout = timeout;
    }

    this.set_charset = function(charset) {
        _charset = charset;
    }

    this.get_cookie = function(key) {
        if (!key) {
            return cookie_string();
        }
        return _cookie[key];
    }
    this.add_cookie = function(name, value) {
        _cookie[name] = value;
    }

    this.get = function(url, headers) {
        if (!headers) {
            headers = {};
        }
        headers["Connection"] = "keep-alive";
        var parsed = URL.parse(url);
        var opt = {
            host: parsed.hostname,
            path: parsed.path,
            method: "GET",
            headers: headers,
        }
        return request(parsed, opt);
    }

    this.delete = function(url, headers) {
        if (!headers) {
            headers = {};
        }
        headers["Connection"] = "keep-alive";
        var parsed = URL.parse(url);
        var opt = {
            host: parsed.hostname,
            path: parsed.path,
            method: "DELETE",
            headers: headers,
        }
        return request(parsed, opt);
    }

    this.post = function(url, param, headers) {
        if (!headers) {
            headers = {};
        }
        var content = querystring.stringify(param);
        headers["Connection"] = "keep-alive";
        headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8"
        headers["Content-Length"] = content.length;
        var parsed = URL.parse(url);
        var opt = {
            host: parsed.hostname,
            path: parsed.path,
            method: "POST",
            headers: headers,
        }
        return request(parsed, opt, content);
    }

    this.form = this.post;

    this.json = function(url, obj, headers) {
        if (!headers) {
            headers = {};
        }
        var content = JSON.stringify(obj);
        headers["Connection"] = "keep-alive";
        headers["Content-Type"] = "application/json; charset=UTF-8";
        headers["Content-Length"] = content.length;
        var parsed = URL.parse(url);
        var opt = {
            host: parsed.hostname,
            path: parsed.path,
            method: "POST",
            headers: headers,
        }
        return request(parsed, opt, content);
    }
};

module.exports = HttpClient;


if (require.main == module) {

}
