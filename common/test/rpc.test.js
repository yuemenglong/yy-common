var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var rpc = common.rpc;
var Q = common.Q;

// logger.log = function() {}

require("should");

describe('RPC', function() {
    it('Abort Test', function(done) {
        this.timeout(30000);
        var abort = false;

        function Service() {
            this.serve = function() {
                // logger.log("serve start");
                rpc.abort(this.serve, function() {
                    // logger.log("abort");
                    abort = true;
                });
                var defer = Q.defer();
                setTimeout(function() {
                    defer.resolve("hello world");
                }, 100);
                return defer.promise;
                // return "hello world";
            }
            rpc.get(this.serve, "/");
        }
        var service = new Service();

        rpc.server(service, "/", 80);
        rpc.start();
        var client = rpc.client(service, "/", "localhost");
        client.set_timeout(50);
        client.serve().then(function() {
            false.should.be.ok;
        }).fail(function(err) {
            // logger.log(err);
            // logger.log(err.stack);
        }).done();
        setTimeout(function() {
            abort.should.be.ok;
            rpc.stop();
            done();
        }, 200);
    });
    it('Json Test', function(done) {
        function Service() {
            this.serve = function(obj) {
                return obj
            }
            rpc.json(this.serve, "/");
        }
        var service = new Service();

        rpc.server(service, "/", 80);
        rpc.start();
        var client = rpc.client(service, "/", "localhost");
        var obj = {
            a: 1
        };
        client.serve(obj).then(function(res) {
            res.should.eql(obj);
        }).done(function() {
            rpc.stop();
            done();
        });
    });
    it('Delete Test', function(done) {
        var gid = undefined;

        function Service() {
            this.serve = function(id) {
                gid = Number(id);
            }
            rpc.delete(this.serve, "/:0");
        }
        var service = new Service();

        rpc.server(service, "/", 80);
        rpc.start();
        var client = rpc.client(service, "/", "localhost");
        client.serve(100).then(function(res) {
            logger.log(res);
            gid.should.eql(100);
        }).done(function() {
            rpc.stop();
            done();
        });
    });
});
