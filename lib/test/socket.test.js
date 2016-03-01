var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var Server = common.Server;
var Socket = common.Socket;

var PORT = 8088;

function fail() {
    should(false).eql(true);
}

var echoServer = new Server();

before(function() {
    common.enableDebugLog();

    function accept(server) {
        return server.accept().then(function(socket) {
            echo(socket).catch().done();
            return accept(server);
        });
    }

    function echo(socket) {
        return socket.readLine().then(function(res) {
            if (res === undefined) {
                return socket.close();
            } else {
                return socket.writeLine(res).then(function() {
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
    common.disableDebugLog();
    echoServer.close().done(function() {});
})


describe('Socket', function() {
    it('Basic', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            return socket.writeLine("hello");
        }).then(function() {
            return socket.readLine();
        }).then(function(res) {
            res.should.eql("hello");
            return socket.close();
        }).done(function() {
            done();
        });
    });

    it('Close', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            return socket.write("hello");
        }).then(function() {
            return socket.close();
        }).done(function() {
            done();
        });
    });
    it('Read', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            return socket.write("he");
        }).then(function() {
            return socket.write("ll");
        }).then(function() {
            return socket.write("o\n");
        }).then(function() {
            return socket.read(5);
        }).then(function(res) {
            res.should.eql(new Buffer("hello"));
            return socket.read();
        }).then(function(res) {
            res.should.eql(new Buffer("\n"));
        }).then(function() {
            return socket.close();
        }).done(function() {
            done();
        });
    });
    it('ReadLine', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            return socket.write("he");
        }).then(function() {
            return socket.write("ll");
        }).then(function() {
            return socket.write("o\n");
        }).then(function() {
            return socket.readLine();
        }).then(function(res) {
            res.should.eql("hello");
        }).then(function() {
            return socket.close();
        }).done(function() {
            done();
        });
    });
    it('ReadLine2', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            return socket.writeLine("11111");
        }).then(function() {
            return socket.writeLine("22222");
        }).then(function() {
            return socket.readLine();
        }).then(function(res) {
            res.should.eql("11111");
            return socket.readLine();
        }).then(function(res) {
            res.should.eql("22222");
        }).then(function() {
            return socket.close();
        }).done(function() {
            done();
        });
    });
    it('Read After Close', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            return socket.close();
        }).then(function() {
            return socket.read();
        }).then(function() {
            fail();
        }).catch(function(err) {
            // logger.log(err);
            done();
        }).done();
    });
    it('Read While Close', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            socket.close();
            return socket.read();
        }).then(function(res) {
            should(res).eql(undefined);
        }).done(function() {
            done();
        });
    });
    it('Write After Close', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            return socket.close();
        }).then(function() {
            return socket.write("hello");
        }).then(function() {
            fail();
        }).catch(function(err) {
            done();
        }).done();
    });
    it('Write While Close', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            socket.close().catch(function(err) {
                // logger.log(err);
            }).done();
            return socket.write("hello");
        }).then(function() {
            fail();
        }).catch(function(err) {
            // logger.error(err);
            done();
        }).done(function() {

        });
    });
    it('Timeout', function(done) {
        common.enableDebugLog();
        var socket = new Socket();
        socket.connect("localhost", PORT).then(function() {
            socket.setTimeout(100);
        }).then(function() {
            return socket.read(1);
        }).then(function() {
            fail();
        }).catch(function(err) {
            err.name.should.eql("SOCKET_TIMEOUT_ERROR");
        }).then(function() {
            return socket.read(1);
        }).then(function() {
            fail();
        }).catch(function(err) {
            err.name.should.eql("SOCKET_TIMEOUT_ERROR")
            done();
        }).done(function() {});
    });
});
