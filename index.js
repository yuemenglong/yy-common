require("./lib/proto.all");

var ArgPicker = require("./lib/arg_picker");
var Exception = require("./lib/exception");
var fx = require("./lib/fx");
var g = require("./lib/g");
var HttpClient = require("./lib/http_client");
var kit = require("./lib/kit");
var logger = require("./lib/logger");
var loop = require("./lib/loop");
var promise = require("./lib/promise");
var Q = require("./lib/q");
var Queue = require("./lib/queue");
var rpc = require("./lib/rpc");
var Scheduler = require("./lib/scheduler");
var Server = require("./lib/server");
var Socket = require("./lib/socket");
var Task = require("./lib/task");
var Time = require("./lib/time");
var WebApp = require("./lib/webapp");
var WebServer = require("./lib/webserver");
var WebSocket = require("./lib/websocket");

var common = {
    ArgPicker: ArgPicker,
    Exception: Exception,
    fx: fx,
    HttpClient: HttpClient,
    kit: kit,
    logger: logger,
    loop: loop,
    promise: promise,
    Q: Q,
    Queue: Queue,
    rpc: rpc,
    Scheduler: Scheduler,
    Server: Server,
    Socket: Socket,
    Task: Task,
    Time: Time,
    WebApp: WebApp, 
    WebServer: WebServer,
    WebSocket: WebSocket,
}

common.enableDebugLog = function() {
    g.debugLog = true;
}

common.disableDebugLog = function() {
    g.debugLog = false;
}

module.exports = common;
