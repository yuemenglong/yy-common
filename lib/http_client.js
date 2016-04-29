var http = require("http");
var https = require("https");
var URL = require("url");
var querystring = require("querystring");
var util = require("util");
var iconv = require('iconv-lite');
var _ = require("lodash");

var Exception = require("./exception");
var Q = require("./q");

var HTTP_ERROR = "HTTP_ERROR";
var HTTP_TIMEOUT_ERROR = "HTTP_TIMEOUT_ERROR";

function HttpClient() {
    var _cookie = {};
    var _timeout = 0;
    var _charset = "utf8";

    function parseCookie(cookieString) {
        if (!cookieString) {
            return {};
        }
        var ret = {};
        var kvs = cookieString.split(";");
        for (var kv of kvs) {
            var match = kv.match(/^\s*(.+?)=(.+?)\s*$/);
            if (!match) {
                continue;
            }
            ret[match[1]] = match[2];
        }
        return ret;
    }

    function stringifyCookie(cookieObject) {
        var arr = [];
        for (var i in cookieObject) {
            arr.push(util.format("%s=%s", i, cookieObject[i]));
        }
        var cookie = arr.join("; ");
        return cookie;
    }

    function handleResponseCookies(setCookies) {
        var regex = /(.+?)=(.+?);.+/;
        for (var i in setCookies) {
            var match = setCookies[i].match(regex);
            _cookie[match[1]] = match[2];
        }
    }

    function setRequestHeader(headers) {
        headers = headers || {};
        headers["Connection"] = headers["Connection"] || "keep-alive";
        // setCookieToHeader(headers);
        headers["Cookie"] = stringifyCookie(_.merge(_cookie, parseCookie(headers["Cookie"])));
        return headers;
    }

    function handleResponseHeader(headers) {
        handleResponseCookies(headers["set-cookie"]);
    }

    function defered(defer, req, res) {
        handleResponseHeader(res.headers);
        // var ret = "";
        var buffer = [];
        res.on("data", function(data) {
            // ret += data;
            buffer.push(data);
        }).on("end", function() {
            var raw = Buffer.concat(buffer);
            var ret = iconv.decode(raw, _charset);
            defer.resolve({
                "status": res.statusCode,
                "statusCode": res.statusCode,
                "statusMessage": res.statusMessage,
                "headers": res.headers,
                "data": ret,
                "body": ret,
                "raw": raw,
            });
        }).on("error", function(err) {
            defer.reject(err);
        });
    }

    function request(url, method, headers, content) {
        var defer = Q.defer();
        headers = setRequestHeader(headers);
        var parsed = URL.parse(url);
        var opt = {
            host: parsed.hostname,
            path: parsed.path,
            method: method,
            headers: headers,
        }
        var req = undefined;
        var res = undefined;
        if (parsed.protocol == "https:") {
            opt.port = parsed.port || 443;
            req = https.request(opt, function(response) {
                res = response;
                defered(defer, req, res);
            });
        } else if (parsed.protocol == "http:") {
            opt.port = parsed.port || 80;
            req = http.request(opt, function(response) {
                res = response;
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
            defer.reject(err);
        });
        if (_timeout) {
            req.setTimeout(_timeout, function() {
                if (res && res.finished) {
                    return;
                }
                req.abort();
                defer.reject(new Exception(
                    HTTP_TIMEOUT_ERROR,
                    util.format("Visit <%s> Timeout [%d]", url, _timeout)
                ));
            });
        }
        return defer.promise;
    }

    this.setTimeout = function(timeout) {
        _timeout = timeout;
    }

    this.setCharset = function(charset) {
        _charset = charset;
    }

    this.getCookie = function(key) {
        return _cookie[key];
    }

    this.getCookieString = function() {
        return stringifyCookie(_cookie);
    }

    this.setCookieString = function(cookieString) {
        _.merge(_cookie, parseCookie(cookieString));
    }

    this.setCookie = function(cookies) {
        _.merge(_cookie, cookies);
    }

    this.addCookie = function(name, value) {
        _cookie[name] = value;
    }

    this.get = function(url, headers) {
        headers = headers || {};
        return request(url, "GET", headers);
    }

    this.delete = function(url, headers) {
        headers = headers || {};
        return request(url, "DELETE", headers);
    }

    this.form = function(url, param, headers) {
        headers = headers || {};
        var content = querystring.stringify(param);
        headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8"
        headers["Content-Length"] = content.length;
        return request(url, "POST", headers, content);
    }

    this.json = function(url, obj, headers) {
        headers = headers || {};
        var content = JSON.stringify(obj);
        headers["Content-Type"] = "application/json; charset=UTF-8";
        headers["Content-Length"] = content.length;
        return request(url, "POST", headers, content);
    }
};

module.exports = HttpClient;


if (require.main == module) {

}
