var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var Server = common.Server;
var Socket = common.Socket;


describe('Socket', function() {
    it('Close', function(done) {
        var server = new Server();
        server.listen(80).then(function() {
            return server.accept();
        }).then(function(socket) {
            return socket.read(5).then(function(data) {
                data.should.eql("hello");
                return socket.read();
            }).then(function(data) {
                should(data).eql(undefined);
                return socket.close();
            })
        }).then(function() {
            return server.close();
        }).done(function() {
            done();
        })
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
            return socket.write("hello");
        }).then(function() {
            return socket.close();
        }).done();
    });
    it('Read After Close', function(done) {
        var server = new Server();
        server.listen(80).then(function() {
            return server.accept();
        }).then(function(socket) {
            return socket.close();
        }).then(function() {
            return server.close();
        }).done(function() {})
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
            return socket.write("hello");
        }).then(function() {
            return socket.read();
        }).then(function(res) {
            should(res).eql(undefined);
            return socket.close();
        }).then(function() {
            return socket.read();
        }).then(function() {
            should(true).eql(false);
        }).catch(function(err) {
            logger.log(err);
        }).done();
    });
});
