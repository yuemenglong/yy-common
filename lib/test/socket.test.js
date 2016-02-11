var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var Server = common.Server;
var Socket = common.Socket;

function fail() {
    should(false).eql(true);
}

var echoServer = new Server();

before(function() {
    echoServer.listen(80).then(function() {
        function accept() {
            return echoServer.accept().then(function(socket) {
                function echo() {
                    return socket.readline().then(function(res) {
                        if (res === undefined) {
                            return socket.close();
                        } else {
                            return socket.write(res + "\n").then(function() {
                                return echo();
                            });
                        }
                    });
                }
                echo().catch(function(err) {}).done();
                return accept();
            });
        }
        accept().catch(function(err) {}).done(function() {
            logger.log("accept finish");
        });
    })
})

after(function() {
    echoServer.close().done(function() {
        logger.log("finish");
    });
})


describe('Socket', function() {
    it('Close', function(done) {
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
            return socket.write("hello");
        }).then(function() {
            return socket.close();
        }).done(function() {
            done();
        });
    });
    it('Read', function(done) {
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
            return socket.write("he");
        }).then(function() {
            return socket.write("ll");
        }).then(function() {
            return socket.write("o\n");
        }).then(function() {
            return socket.read(5);
        }).then(function(res) {
            res.should.eql("hello");
            return socket.read();
        }).then(function(res) {
            res.should.eql("\n");
        }).then(function() {
            return socket.close();
        }).done(function() {
            done();
        });
    });
    it('Readline', function(done) {
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
            return socket.write("he");
        }).then(function() {
            return socket.write("ll");
        }).then(function() {
            return socket.write("o\n");
        }).then(function() {
            return socket.readline();
        }).then(function(res) {
            res.should.eql("hello");
        }).then(function() {
            return socket.close();
        }).done(function() {
            done();
        });
    });
    it('Read After Close', function(done) {
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
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
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
            socket.close();
            return socket.read();
        }).then(function(res) {
            should(res).eql(undefined);
        }).done(function() {
            done();
        });
    });
    it('Write After Close', function(done) {
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
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
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
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
        var socket = new Socket();
        socket.connect("localhost", 80).then(function() {
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
