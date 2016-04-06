var should = require("should");

var http = require("http");
var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var WebSocket = common.WebSocket;
var WebApp = common.WebApp;

var PORT = 8082;

function fail() {
    should(false).eql(true);
}

var echoServer = new WebApp();

before(function() {
    common.enableDebugLog();
    echoServer.listen(PORT);
})

after(function() {
    common.disableDebugLog();
    echoServer.close();
})


describe('WebSocket', function() {
    it('Send & Recv', function(done) {
        common.enableDebugLog();
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
        common.enableDebugLog();
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
        common.enableDebugLog();
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
