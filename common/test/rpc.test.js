var loop = require("../loop");
var logger = require("../logger");
var Q = require("q");
var kit = require("../kit");
var rpc = require("../rpc");

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
                }, 2000);
                return defer.promise;
                // return "hello world";
            }
            rpc.get(this.serve, "/");
        }
        var service = new Service();

        rpc.server(service, "/", 80);
        rpc.start();
        var client = rpc.client(service, "/", "localhost");
        client.set_timeout(1000);
        client.serve().fail(function(err) {
            // logger.log(err);
            // logger.log(err.stack);
        }).done();
        setTimeout(function() {
            abort.should.be.ok;
            rpc.stop();
            done();
        }, 3000);
    });
});
