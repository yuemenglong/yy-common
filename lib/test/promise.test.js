var should = require("should");
// var Q = require("q");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var promise = common.promise;
var Q = common.Q;


describe('Promise', function() {
    it('Basic', function(done) {
        function A() {
            return "asdf";
        }
        logger.log("asdf");
        // new Promise(A()).then(function(res) {
        promise(A).then(function(res) {
            res.should.eql("asdf");
            return res;
        }).then(function(res) {
            res.should.eql("asdf");
            throw new Exception("TEST_ERROR");
        }).then(function(res) {
            false.should.be.ok;
        }).fail(function(err) {
            err.name.should.eql("TEST_ERROR");
            throw err;
        }).fail(function(err) {
            err.name.should.eql("TEST_ERROR");
            return "handle";
        }).then(function(res) {
            res.should.eql("handle");
        }).done(function() {
            done();
        });
    });
    it('Return Real Promise', function(done) {
        promise(function() {
            var defer = Q.defer();
            setTimeout(function() {
                defer.resolve("OK");
            }, 100);
            return defer.promise;
        }).then(function(data) {
            data.should.eql("OK");
        }).done(function() {
            done();
        });
    });
});
