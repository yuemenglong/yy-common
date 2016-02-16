var should = require("should");

var http = require("http");
var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var WebServer = common.WebServer;
var WebSocket = common.WebSocket;

common.enableDebugLog();

var PORT = 8081;


function fail() {
    should(false).eql(true);
}

var echoServer = new WebServer();

before(function() {
    function accept(server) {
        return server.accept().then(function(socket) {
            echo(socket).catch(function(err) {
                return socket.close();
            }).done();
            return accept(server);
        })
    }

    function echo(socket) {
        return socket.recv().then(function(msg) {
            if (msg === undefined) {
                return socket.close();
            } else {
                return socket.send(msg).then(function() {
                    return echo(socket);
                });
            }
        })
    }

    echoServer.listen(PORT).then(function() {
        accept(echoServer).done();
    }).done();
})

after(function() {
    echoServer.close().done(function() {});
})


describe('WebSocket', function() {
    it('Send & Recv', function(done) {
        var socket = new WebSocket();
        socket.connect("http://localhost:" + PORT).then(function() {
            return socket.send("hello");
        }).then(function() {
            return socket.recv();
        }).then(function(res) {
            res.should.eql("hello");
            return socket.close();
        }).done(function() {
            done();
        });
    });

    it('Read After Close', function(done) {
        var socket = new WebSocket();
        socket.connect("http://localhost:" + PORT).then(function() {
            return socket.close();
        }).then(function() {
            return socket.recv();
        }).then(function() {
            fail();
        }).catch(function(err) {
            done();
        }).done();
    });

    it('Write After Close', function(done) {
        var socket = new WebSocket();
        socket.connect("http://localhost:" + PORT).then(function() {
            return socket.close();
        }).then(function() {
            return socket.write("hello");
        }).then(function() {
            fail();
        }).catch(function(err) {
            done();
        }).done();
    });
});
