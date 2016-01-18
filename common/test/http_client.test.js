var logger = require("../logger");
var Q = require("q");
var rpc = require("../rpc");
var HttpClient = require("../http_client");

var should = require("should");

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
});
