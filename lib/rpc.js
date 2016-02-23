var logger = require("./logger");
var Exception = require("./exception");
var promise = require("./promise");
var kit = require("./kit");
var HttpClient = require("./http_client");
var g = require("./g");

var express = require("express");
var bodyParser = require('body-parser');
var util = require("util");
var fs = require("fs");
var Promise = require("bluebird");

var RPC_ERROR = "RPC_ERROR";

function RpcPath(path, fn) {
    this.path = path;
    var params = path.split("?")[0];
    params = path.match(/\/:[^\/?]+/g);
    this.params = {};
    for (var i in params) {
        var param = params[i].slice(1);
        var name = param.slice(1);
        // this.params[param] = name;
        this.params[name] = param;
    }
    var query = path.split("?")[1];
    query = query ? query.match(/:[^&]+/g) : [];
    this.query = {};
    for (var i in query) {
        var q = query[i];
        var name = q.slice(1);
        // this.query[q] = name;
        this.query[name] = q;
    }
    this.pathArgs = this.params.$concat(this.query);
    this.fnArgs = fn.$args();
}

RpcPath.prototype.toPath = function(args) {
    var path = this.path;
    for (var i = 0; i < args.length; i++) {
        var name = this.fnArgs[i];
        var value = encodeURIComponent(args[i]);
        path = path.replace(this.pathArgs[name], value);
    }
    if (path.indexOf("/:") >= 0) {
        throw new Exception(RPC_ERROR, "Arguments Not Match On Client", {
            path: path,
        })
    }
    return path;
}

function RpcArgs(fn) {
    this.fnArgs = fn.$args();
}

RpcArgs.prototype.toArgs = function(mergedObj) {
    var ret = [];
    for (var i = 0; i < this.fnArgs.length; i++) {
        ret.push(mergedObj[this.fnArgs[i]]);
    }
    return ret;
}

function normalizePath(path) {
    path = path.replace("//", "/");
    if (path !== "/" && path.slice(-1) === "/") {
        path = path.slice(0, -1);
    }
    return path;
}

function sendSucc(res, obj) {
    if (typeof obj === "object") {
        return res.json(obj);
    } else {
        return res.end(obj);
    }
}

function sendError(res, err) {
    var clone = err.$concat({
        name: err.name,
        message: err.message,
    });
    return res.status(500).json(clone);
}

function logRequest(service, fn, req) {
    // method url body
    var port = fn.$RPC.port;
    var method = fn.$RPC.clientMethod.toUpperCase();
    var url = req.url;
    var serviceName = service.constructor.name;
    var fnName = fn.$RPC.name;
    var body = req.body ? "\n" + JSON.stringify(req.body) : "";
    if (body === "\n{}") {
        body = "";
    }
    logger.info("[%s] << %s %s [%s.%s]%s", port, method, url, serviceName, fnName, body);
}

function logResponse(service, fn, req, data) {
    // method url body
    var port = fn.$RPC.port;
    var method = fn.$RPC.clientMethod.toUpperCase();
    var url = req.url;
    var serviceName = service.constructor.name;
    var fnName = fn.$RPC.name;
    var body = "";
    if (typeof data === "object") {
        body = "\n" + JSON.stringify(data);
    } else if (data !== undefined) {
        body = "\n" + data.toString();
    }
    logger.info("[%s] >> %s %s [%s.%s]%s", port, method, url, serviceName, fnName, body);
}

function logError(service, fn, req, err) {
    // method url body
    var port = fn.$RPC.port;
    var method = fn.$RPC.clientMethod.toUpperCase();
    var url = req.url;
    var serviceName = service.constructor.name;
    var fnName = fn.$RPC.name;
    var clone = err.$concat({
        name: err.name,
        message: err.message,
    });
    var body = "\n" + JSON.stringify(clone);
    logger.error("[%s] !! %s %s [%s.%s]%s", port, method, url, serviceName, fnName, body);
    if (g.debugLog) {
        logger.error(err);
    }
}

function logAbort(service, fn, req) {
    // method url body
    var port = fn.$RPC.port;
    var method = fn.$RPC.clientMethod.toUpperCase();
    var url = req.url;
    var serviceName = service.constructor.name;
    var fnName = fn.$RPC.name;
    var body = req.body ? "\n" + JSON.stringify(req.body) : "";
    if (body === "\n{}") {
        body = "";
    }
    logger.warn("[%s] ~~ %s %s [%s.%s]%s", port, method, url, serviceName, fnName, body);
}

function addToAppMethod(app, service, base, fn) {
    var appMethod = fn.$RPC.appMethod;
    var port = fn.$RPC.port;
    var name = fn.$RPC.name;
    var path = base + fn.$RPC.path;
    path = normalizePath(path).split("?")[0];
    var rpcArgs = new RpcArgs(fn);
    var clientMethod = fn.$RPC.clientMethod;
    logger.info("[%d] %s %s [%s.%s]", port, clientMethod.toUpperCase(), path,
        service.constructor.name, name);
    app[appMethod](path, function(req, res) {
        var merged = req.params.$concat(req.query);
        var args = null;
        if (clientMethod === "get" || clientMethod === "delete") {
            args = rpcArgs.toArgs(merged);
        } else if (clientMethod === "form" || clientMethod === "json") {
            merged[rpcArgs.fnArgs.slice(-1)[0]] = req.body;
            args = rpcArgs.toArgs(merged);
        }

        logRequest(service, fn, req);
        Promise.try(function() {
            return fn.apply(service, args);
        }).then(function(data) {
            logResponse(service, fn, req, data);
            sendSucc(res, data);
        }).catch(function(err) {
            logError(service, fn, req, err);
            sendError(res, err);
        }).done();

        var abort = fn.$RPC.abort;
        if (abort) {
            req.on("close", function() {
                logAbort(service, fn, req);
                abort();
            });
        }
    });
}

function handleSucc(res) {
    var ct = res.headers["content-type"];
    if (ct && ct.indexOf("json") >= 0) {
        return JSON.parse(res.data);
    } else {
        return res.data;
    }
}

function handleFail(res) {
    var ret = JSON.parse(res.data);
    var err = new Exception(ret.name, ret.message, ret);
    throw err;
}

function logCall(url, method) {
    logger.info("Call %s %s", method.toUpperCase(), url);
}

function logReply(url, res, method) {
    var body = res.body ? "\n" + res.body : "";
    logger.info("Reply %s %s%s", method.toUpperCase(), url, body);
}

function logFail(url, res, method) {
    logger.error("Fail %s %s\n%s", method.toUpperCase(), url, res.body);
}

function addToClientMethod(client, httpClient, base, fn) {
    var path = base + fn.$RPC.path;
    var name = fn.$RPC.name;
    path = normalizePath(path);
    var rpcPath = new RpcPath(path, fn);
    var clientMethod = fn.$RPC.clientMethod;
    client[name] = function() {
        var url = "http://";
        var obj = undefined;
        if (clientMethod === "get" || clientMethod === "delete") {
            url += rpcPath.toPath(arguments);
        } else if (clientMethod === "form" || clientMethod === "json") {
            url += rpcPath.toPath(arguments);
            obj = arguments[arguments.length - 1];
        }

        logCall(url, clientMethod);
        return httpClient[clientMethod](url, obj).then(function(res) {
            if (res.status !== 200) {
                logFail(url, res, clientMethod);
                return handleFail(res);
            } else {
                logReply(url, res, clientMethod);
                return handleSucc(res);
            }
        });
    }
}

function getRpcFn(service) {
    var ret = [];
    for (var i in service) {
        if (typeof service[i] === "function" && service[i].$RPC !== undefined) {
            service[i].$RPC.name = i;
            ret.push(service[i]);
        }
    }
    return ret;
}

function RPC() {
    this.get = function(fn, path) {
        var match = path.match(/:/g) || [];
        var argsLength = match.length;
        if (fn.length !== argsLength) {
            throw new Exception(RPC_ERROR, "Args Not Match", {
                fn: fn.length,
                path: argsLength,
            })
        }
        fn.$RPC = {
            appMethod: "get",
            clientMethod: "get",
            path: path,
        }
    }
    this.delete = function(fn, path) {
        var match = path.match(/:/g) || [];
        var argsLength = match.length;
        if (fn.length !== argsLength) {
            throw new Exception(RPC_ERROR, "Args Not Match", {
                fn: fn.length,
                path: argsLength,
            })
        }
        fn.$RPC = {
            appMethod: "delete",
            clientMethod: "delete",
            path: path,
        }
    }
    this.form = function(fn, path) {
        var match = path.match(/:/g) || [];
        var argsLength = match.length + 1;
        if (fn.length !== argsLength) {
            throw new Exception(RPC_ERROR, "Args Not Match", {
                fn: fn.length,
                path: argsLength,
            })
        }
        fn.$RPC = {
            appMethod: "post",
            clientMethod: "form",
            path: path,
        }
    }
    this.json = function(fn, path) {
        var match = path.match(/:/g) || [];
        var argsLength = match.length + 1;
        if (fn.length !== argsLength) {
            throw new Exception(RPC_ERROR, "Args Not Match", {
                fn: fn.length,
                path: argsLength,
            })
        }
        fn.$RPC = {
            appMethod: "post",
            clientMethod: "json",
            path: path,
        }
    }
    this.abort = function(fn, cb) {
        fn.$RPC.abort = cb;
    }

    var apps = {};
    var servers = {};
    this.server = function(service, path, port) {
        var app = apps[port];
        if (app === undefined) {
            app = express();
            app.use(bodyParser.json()); // for parsing application/json
            app.use(bodyParser.urlencoded({
                extended: true
            }));
            apps[port] = app;
        }
        var fns = getRpcFn(service);
        for (var i in fns) {
            fns[i].$RPC.port = port;
            addToAppMethod(app, service, path, fns[i]);
        }
    }
    this.client = function(service, path, host) {
        var httpClient = new HttpClient();
        var fns = getRpcFn(service);
        var client = {};
        client.setTimeout = function(t) {
            httpClient.setTimeout(t);
        }
        for (var i in fns) {
            addToClientMethod(client, httpClient, host + path, fns[i]);
        }
        return client;
    }
    this.start = function() {
        var result = Promise.resolve();
        for (var i in apps) {
            var app = apps[i];
            ! function(app) {
                result = result.then(function() {
                    return new Promise(function(resolve, reject) {
                        var server = app.listen(i, function(err) {
                            if (err) {
                                logger.error("[%d] Start Fail", i);
                                reject(err);
                            } else {
                                logger.info("[%d] Start Succ ..............", i);
                                resolve();
                            }
                        });
                        servers[i] = server;
                    })
                })
            }(app);
        }
        return result;
    }
    this.stop = function() {
        var result = Promise.resolve();
        for (var i in servers) {
            var server = servers[i];
            ~ function(server) {
                result = result.then(function() {
                    return new Promise(function(resolve, reject) {
                        server.close(function(err) {
                            if (err) {
                                logger.error("Stop On [%d] Fail", i);
                                reject(err);
                            } else {
                                logger.info("Stop On [%d] Succ ...............", i);
                                resolve();
                            }
                        });
                    });
                })
            }(server);
        }
        apps = [];
        servers = [];
        return result;
    }
    this.compile = function(service) {
        var output = util.format("function %s(){\n", service.constructor.name);
        var fns = getRpcFn(service);
        for (var i in fns) {
            var fnName = fns[i].$RPC.name;
            output += util.format("this.%s=function(%s){}\n", fnName, fns[i].$args());
            output += util.format("this.%s.$RPC=%j\n", fnName, {
                appMethod: fns[i].$RPC.appMethod,
                clientMethod: fns[i].$RPC.clientMethod,
                path: fns[i].$RPC.path,
            });
        }
        output += "}\n";
        output += util.format("module.exports=%s\n", service.constructor.name);
        return output;
    }
}

var rpc = new RPC();

module.exports = rpc;

if (require.main == module) {
    var argv = process.argv;
    if (argv.length !== 3 && argv.length !== 4) {
        console.log("Usage: node rpc [service] [output]");
        return;
    }
    try {
        var service = require(argv[2]);
        if (getRpcFn(service).length === 0) {
            service = new service();
        }
        if (getRpcFn(service).length === 0) {
            throw new Error("No RPC Function");
        }
        var output = rpc.compile(service);
        console.log(output);
        if (argv.length === 4) {
            kit.writeFileSync(argv[3], output);
        }
    } catch (ex) {
        console.error(ex);
    }
}
