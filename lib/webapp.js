var ws = require("ws");
var common = require("../");
var logger = common.logger;
var Exception = common.Exception;

function WebApp() {
    this._server = undefined;

    this.onmessage = undefined;
    this.onopen = undefined;
    this.onclose = undefined;
    this.onerror = undefined;
}

function onEvent(webApp) {
    webApp._server.on("connection", function(socket) {
        if (webApp.onopen) {
            try {
                webApp.onopen(socket);
            } catch (err) {
                logger.error(err);
                socket.close();
                return;
            }
        }
        socket.on("close", function() {
            if (webApp.onclose) {
                try {
                    webApp.onclose(socket);
                } catch (err) {
                    logger.error(err);
                    socket.close();
                    return;
                }
            }
        })
        socket.on("error", function(err) {
            if (webApp.onerror) {
                try {
                    webApp.onerror(err, socket);
                } catch (err) {
                    logger.error(err);
                }
                socket.close();
                return;
            }
        })
        socket.on("message", function(msg, opt) {
            if (!webApp.onmessage) {
                socket.send(msg, opt);
                return;
            }
            try {
                var ret = webApp.onmessage(msg, opt, socket);
            } catch (err) {
                logger.error(err);
                socket.close();
                return;
            }
            if (ret === undefined) {
                return;
            }
            if (typeof ret === "object") {
                socket.send(JSON.stringify(ret));
            } else {
                socket.send(ret);
            }
        });
    });
}

WebApp.prototype.attach = function(server) {
    this._server = new ws.Server({
        server: server,
    })
    onEvent(this);
}

WebApp.prototype.listen = function(port) {
    this._server = new ws.Server({
        port: port,
    })
    onEvent(this);
}

WebApp.prototype.close = function() {
    this._server.close();
}

module.exports = WebApp;