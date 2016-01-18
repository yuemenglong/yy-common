var logger = require("../logger");
var Q = require("q");
var Promise = require("../promise");
var Exception = require("../exception");

require("should");

describe('Promise', function() {
    it('Basic', function(done) {
        function A() {
            return "asdf";
        }
        new Promise(A()).then(function(res) {
            res.should.eql("asdf");
            return res;
        }).then(function(res) {
            res.should.eql("asdf");
            throw new Exception("TEST_ERROR");
        }).then(function(res) {
            false.should.be.ok;
        }).fail(function(err) {
            err.err.should.eql("TEST_ERROR");
            throw err;
        }).fail(function(err) {
            err.err.should.eql("TEST_ERROR");
            return "handle";
        }).then(function(res) {
            res.should.eql("handle");
        }).done(function() {
            done();
        });
    });
    it('Transport Return', function(done) {
        var defer = Q.defer();
        var p = new Promise(defer.promise);
        p.should.eql(defer.promise);
        var p2 = new Promise(p);
        p2.should.eql(p);

        var p3 = new Promise(true);
        var p4 = new Promise(p3);
        p4.should.eql(p3);
        done();
    });
});
