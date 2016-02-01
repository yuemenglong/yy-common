var logger = require("./logger");
var Exception = require("./exception");
var promise = require("./promise");
var kit = require("./kit");
var HttpClient = require("./http_client");

var express = require("express");
var bodyParser = require('body-parser');
var util = require("util");
var fs = require("fs");

var RPC_ERROR = "RPC_ERROR";

function invoke_server(func, service, req, res, json) {
    // var promise = new Promise();
    var params = req.params || {};
    return promise(function() {
        // var args = [].slice.call(params)
        var args = [];
        for (var i = 0; i < func.length; i++) {
            var arg = params[i];
            if (!arg) {
                break;
            }
            args.push(decodeURIComponent(arg));
        }
        if (!kit.empty(json)) {
            args.push(json);
        }
        if (params[i] || args.length != func.length) {
            throw new Exception(
                RPC_ERROR,
                "Arguments Length Not Match On Server", {
                    func: func.length,
                    args: args.length
                }
            );
        }
        var ret = func.apply(service, args);
        return ret;
    });
}

function invoke_client(client, method, host, path, func, args, json) {
    var url = path.replace(/:\d/g, function(index) {
        return encodeURIComponent(args[index[1]]);
    });
    url = util.format("http://%s%s", host, url);
    var call_info = util.format("Call %s: %s%s", method.toUpperCase(), url,
        json ? "\n" + JSON.stringify(json) : "");
    logger.info(call_info);
    return client[method](url, json).then(function(res) {
        if (res.statusCode != 200) {
            var fail_info = util.format("Fail %s: %s%s", method.toUpperCase(), url,
                res.data ? "\n" + res.data : "");
            logger.info(fail_info);
            var ex = Exception.parse(res.data);
            if (ex) {
                ex.detail.status = res.statusCode;
                ex.detail.url = url;
                throw ex;
            }
            throw new Exception(
                RPC_ERROR,
                "Invalid Status Code", {
                    status: res.statusCode,
                    url: url,
                    err: res.data,
                }
            )
        }
        var reply_info = util.format("Reply %s: %s%s", method.toUpperCase(), url,
            res.data ? "\n" + res.data : "");
        logger.info(reply_info);
        if (res.headers["content-type"] && res.headers["content-type"].indexOf("json") >= 0) {
            return JSON.parse(res.data);
        } else {
            return res.data;
        }
    });
}

function Get(pack) {

    this.invoke_server = function(service, func, req, res) {
        return invoke_server(func, service, req, res, req.body);
    }

    this.invoke_client = function(client, func, host, path, args) {
        return invoke_client(client, "get", host, path, func, args);
    }
}

function Json(pack) {

    this.invoke_server = function(service, func, req, res) {
        return invoke_server(func, service, req, res, req.body);
    }

    this.invoke_client = function(client, func, host, path, args) {
        var args = [].slice.apply(args);
        return invoke_client(client, "json", host, path, func,
            args.slice(0, -1), args.slice(-1)[0]);
    }
}

function Delete(pack) {

    this.invoke_server = function(service, func, req, res) {
        return invoke_server(func, service, req, res);
    }

    this.invoke_client = function(client, func, host, path, args) {
        return invoke_client(client, "delete", host, path, func, args);
    }
}

function RPC() {

    var handler_table = {
        "get": Get,
        "delete": Delete,
        "json": Json,
    }
    var _app_table = {};

    this.get = function(func, path) {
        var match = path.match(/:\d/g);
        match = match ? match : {
            length: 0
        };
        if (match.length != func.length) {
            throw new Exception(
                RPC_ERROR,
                "Func Arguments And Path Params Not Match", {
                    func: func.length,
                    path: match.length,
                    info: path,
                }
            )
        }
        func.__RPC__ = {
            app_method: "get",
            client_method: "get",
            path: path
        };
    }
    this.delete = function(func, path) {
        var match = path.match(/:\d/g);
        match = match ? match : {
            length: 0
        };
        if (match.length != func.length) {
            throw new Exception(
                RPC_ERROR,
                "Func Arguments And Path Params Not Match", {
                    func: func.length,
                    path: match.length,
                    info: path,
                }
            )
        }
        func.__RPC__ = {
            app_method: "delete",
            client_method: "delete",
            path: path
        };
    }
    this.json = function(func, path) {
        var match = path.match(/:\d/g);
        match = match ? match : {
            length: 0
        };
        if (match.length + 1 != func.length) {
            throw new Exception(
                RPC_ERROR,
                "Func Arguments And Path Params Not Match", {
                    func: func.length,
                    path: match.length + 1,
                    info: path,
                }
            )
        }
        func.__RPC__ = {
            app_method: "post",
            client_method: "json",
            path: path
        };
    }

    this.abort = function(func, cb) {
        if (!func.__RPC__) {
            return;
        }
        if (func.__RPC__.abort) {
            return;
        }
        //means has setted
        func.__RPC__.abort = cb;
    }
    this.start = function() {
        for (var i in _app_table) {
            var app = _app_table[i];
            var port = i;
            var server = app.listen(port, function(err) {
                logger.info(util.format(
                    "RPC Server Start At Port %d Succ ............... ",
                    port));
            });
            app.close = function(cb) {
                server.close(cb);
            }
        }
        process.on('uncaughtException', function(err) {
            logger.error(err);
            logger.error(err.stack);
        });
    }
    this.stop = function() {
        for (var i in _app_table) {
            var app = _app_table[i];
            var port = i;
            app.close(function() {
                logger.info(util.format(
                    "RPC Server Stop At Port %d ............... ",
                    port));
            });
            delete(_app_table[i]);
        }
    }
    this.server = function(service, path, port) {
        if (arguments.length != arguments.callee.length) {
            throw new Exception(
                RPC_ERROR,
                "RPC Server Need Path And Port"
            );
        }
        if (!_app_table[port]) {
            var app = express();
            app.use(bodyParser.json()); // for parsing application/json
            app.use(bodyParser.urlencoded({
                extended: true
            }));
            _app_table[port] = app;
        }
        var app = _app_table[port];
        var class_name = service.constructor.name;

        for (var i in service) {
            var func = service[i];
            if (typeof func != "function") {
                continue;
            }
            if (!func.__RPC__) {
                continue;
            }

            ! function(func, name) {
                var pack = func.__RPC__;
                var handler = new handler_table[pack.client_method](pack);
                var act_path = (path == "/" ? "" : path) + pack.path;
                logger.info(util.format("%s [%d] [%s.%s] [%s]",
                    pack.client_method.toUpperCase(), port,
                    class_name, name, act_path));

                app[pack.app_method](act_path, function(req, res) {
                    var req_info = util.format("%s: %s [%s.%s]",
                        pack.client_method.toUpperCase(), req.url, class_name, name);
                    var req_body = kit.empty(req.body) ? "" : "\n" + JSON.stringify(req.body);
                    logger.info("Request " + req_info + req_body);

                    handler.invoke_server(service, func, req, res).then(function(data) {
                        var res_body = data ? "\n" + JSON.stringify(data) : "";
                        if (data == undefined) {
                            logger.info("Response " + req_info);
                            return res.end();
                        } else if (typeof data == "object") {
                            var res_body = data ? "\n" + JSON.stringify(data) : "";
                            logger.info("Response " + req_info + res_body);
                            return res.json(data);
                        } else {
                            var res_body = data ? "\n" + data : "";
                            logger.info("Response " + req_info + res_body);
                            return res.end(data.toString());
                        }
                    }).fail(function(ex) {
                        ex = new Exception(ex);
                        var json = JSON.stringify(ex);
                        var error_info = util.format("%s\n%s", req_info, json);
                        logger.error("Error: " + error_info);
                        logger.error(ex.stack);
                        return res.status(500).json(ex);
                    }).done();

                    if (pack.abort) {
                        req.on("close", function() {
                            logger.warn("Abort " + req_info);
                            pack.abort();
                        });
                    }
                });
            }(func, i);
        }
    }
    this.client = function(service, path, host) {
        if (arguments.length != arguments.callee.length) {
            throw new Exception(
                RPC_ERROR,
                "RPC Client Need Path And Host"
            );
        }
        var ret = {};
        var client = new HttpClient();
        ret.set_timeout = function(timeout) {
            client.set_timeout(timeout);
        }
        for (var i in service) {
            var func = service[i];
            if (typeof func != "function") {
                continue;
            }
            if (!func.__RPC__) {
                continue;
            }
            //
            ! function(func, name) {
                var pack = func.__RPC__;
                var handler = new handler_table[pack.client_method](pack);
                var act_path = (path == "/" ? "" : path) + pack.path;
                ret[i] = function() {
                    var args = arguments;
                    // var promise = new Promise();
                    return promise(function() {
                        if (args.length != func.length) {
                            throw new Exception(
                                RPC_ERROR,
                                "Arguments Length Not Match On Client", {
                                    func: func.length,
                                    args: args.length
                                }

                            );
                        }
                        // this.invoke_client = function(client, host, path, args)
                        return handler.invoke_client(client, func, host, act_path, args);
                    });
                }
            }(func, i);
        }
        return ret;
    }
    this.compile = function(service) {
        var template = "function RpcServiceStub(){\n%s\n}\nmodule.exports = RpcServiceStub;";
        var lines = [];
        for (var i in service) {
            var func = service[i];
            if (typeof func != "function") {
                continue;
            }
            if (!func.__RPC__) {
                continue;
            }
            var match = func.toString().match(/function .*\((.*)\)/);
            var fmt = "    this.%s = function(%s) {}";
            var line = util.format(fmt, i, match[1]);
            lines.push(line);
            fmt = "    this.%s.__RPC__ = %s";
            line = util.format(fmt, i, JSON.stringify(func.__RPC__));
            lines.push(line);
        }
        var content = lines.join("\n");
        var ret = util.format(template, content);
        return ret;
    }
}

var rpc = new RPC();
module.exports = rpc;

if (require.main == module) {
    if (process.argv.length != 4) {
        console.log("Usage: node rpc [service_path] [output_path]");
        return;
    }
    var service_path = process.argv[2];
    var output_path = process.argv[3];
    var Service = require(process.cwd() + "/" + service_path);
    var service = typeof Service == "function" ? new Service : Service;
    var stub = rpc.compile(service);
    console.log(stub);
    fs.writeFileSync(process.cwd() + "/" + output_path, stub);
}
