var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var rpc = common.rpc;
var HttpClient = common.HttpClient;

//cookie
//timeout
//gbk

describe('Http Client', function() {
    it('Basic', function(done) {
        var Service = function() {
            this.get = function() {
                return "中文";
            }
            rpc.get(this.get, "/");
        }
        rpc.server(new Service(), "/", 80);
        rpc.start();
        var client = new HttpClient();
        client.get("http://localhost/").then(function(res) {
            // logger.log(data);
            res.data.should.eql("中文");
        }).done(function() {
            rpc.stop();
            done();
        });
    });

    it('Timeout', function(done) {
        var Service = function() {
            this.get = function(timeout) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve("OK");
                    }, timeout * 100);
                });
            }
            rpc.get(this.get, "/:timeout");
        }
        rpc.server(new Service(), "/", 80);
        rpc.start();
        var client = new HttpClient();
        client.setTimeout(3 * 100);
        client.get("http://localhost/1").then(function(res) {
            res.data.should.eql("OK");
        }).done(function() {
            rpc.stop();
            done();
        });
    });

    it('Timeout2', function(done) {
        var Service = function() {
            this.get = function(timeout) {
                return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                        resolve("OK");
                    }, timeout * 100);
                });
            }
            rpc.get(this.get, "/:timeout");
        }
        rpc.server(new Service(), "/", 80);
        rpc.start();
        var client = new HttpClient();
        client.setTimeout(50);
        client.get("http://localhost/1").fail(function(err) {
            err.name.should.eql("HTTP_TIMEOUT_ERROR");
        }).done(function() {
            rpc.stop();
            done();
        });
    });
});
