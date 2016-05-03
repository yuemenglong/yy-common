var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
// var rpc = common.rpc;
var rpc = common.rpc;
var Promise = require("bluebird");

// logger.log = function() {}

require("should");

describe('RPC', function() {
    it('Get Test', function(done) {
        var obj = {};

        function Service() {
            this.serve = function(id, name, order) {
                obj.id = id;
                obj.name = name;
                obj.order = order;
                return obj;
            }
            rpc.get(this.serve, "/id/:id/name/:name?order=:order");
        }
        var service = new Service();
        rpc.server(service, "/service", 80);
        rpc.start().then(function() {
            return rpc.client(service, "/service", "localhost").serve(1, ":", "?");
        }).then(function(res) {
            res.should.eql(obj);
        }).finally(function() {
            return rpc.stop();
        }).done(function() {
            done();
        })
    });
    it('Multi Test', function(done) {
        function Service() {
            this.serve = function() {
                return Promise.delay(500).then(function() {
                    return "OK";
                })
            }
            rpc.get(this.serve, "/");
        }
        var service = new Service();
        rpc.server(service, "/", 80);
        var client = rpc.client(service, "/", "localhost");
        rpc.start().then(function() {
            client.serve();
            client.serve();
            client.serve();
            return client.serve();
        }).finally(function() {
            return rpc.stop();
        }).done(function() {
            done();
        })
    });
    it('Abort Timeout Test', function(done) {
        var abort = false;

        function Service() {
            this.serve = function() {
                rpc.abort(this.serve, function() {
                    abort = true;
                })
                return Promise.delay(500).then(function() {
                    if (abort) {
                        return "ABORT";
                    }
                    return "OK";
                });
            }
            rpc.get(this.serve, "/");
        }
        var service = new Service();
        rpc.server(service, "/", 80);
        var client = rpc.client(service, "/", "localhost");
        client.setTimeout(100);
        rpc.start().then(function() {
            return client.serve();
        }).catch(function(err) {
            return Promise.delay(500);
        }).finally(function() {
            return rpc.stop();
        }).done(function() {
            abort.should.eql(true);
            done();
        })
    });
    it('Delete Test', function(done) {
        var gid = 0;

        function Service() {
            this.delete = function(id) {
                gid = 100;
            }
            rpc.delete(this.delete, "/:id");
        }
        var service = new Service();
        rpc.server(service, "/", 80);
        rpc.start().then(function() {
            return rpc.client(service, "/", "localhost").delete(100);
        }).then(function(res) {
            gid.should.eql(100);
        }).finally(function(err) {
            return rpc.stop();
        }).done(function() {
            done();
        })
    });
    it('Json Test', function(done) {
        var gobj = {
            i: 1,
            s: "asd"
        };

        function Service() {
            this.json = function(obj) {
                return obj;
            }
            rpc.json(this.json, "/");
        }
        var service = new Service();
        rpc.server(service, "/", 80);
        rpc.start().then(function() {
            return rpc.client(service, "/", "localhost").json(gobj);
        }).then(function(res) {
            res.should.eql(gobj);
        }).finally(function() {
            return rpc.stop();
        }).catch(function(err) {
            logger.error(err);
        }).done(function() {
            done();
        })
    });
    it('Error Test', function(done) {
        common.disableDebugLog();

        function Service() {
            this.serve = function() {
                throw new Exception("RPC_TEST_CASE_ERROR", "Test Error", {
                    a: 1,
                    b: 2
                })
            }
            rpc.get(this.serve, "/");
        }
        var service = new Service();
        rpc.server(service, "/", 80);
        rpc.start().then(function() {
            return rpc.client(service, "/", "localhost").serve();
        }).then(function(res) {
            should(true).eql(false);
        }).catch(function(err) {
            err.name.should.eql("RPC_TEST_CASE_ERROR");
            err.message.should.eql("Test Error");
            err.a.should.eql(1);
            err.b.should.eql(2);
        }).finally(function() {
            return rpc.stop();
        }).done(function() {
            done();
        })
    });
});
