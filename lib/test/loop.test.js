var should = require("should");
// var Q = require("q");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var loop = common.loop;
var Q = common.Q;
var Promise = require("bluebird");

describe('Retry', function() {
    it('Retry Return Succ', function(done) {
        var cur = 0;
        loop.retry(function() {
            cur++;
            if (cur > 3) {
                return Promise.resolve(cur);
            }
            throw new Error("TEST");
        }).done(function(data) {
            cur.should.eql(4);
            done();
        });
    });

    it('Retry Promise Succ', function(done) {
        var cur = 0;
        loop.retry(function() {
            cur++;
            var defer = Q.defer();
            setTimeout(function() {
                if (cur > 3) {
                    defer.resolve(cur);
                }
                defer.reject(cur);
            }, 10);
            return defer.promise;
        }).done(function(data) {
            cur.should.eql(4);
            done();
        });
    });

    it('Retry Max Times', function(done) {
        var cur = 0;
        loop.retry(function() {
            cur++;
            if (cur > 10) {
                return Promise.resolve(cur);
            }
            throw new Error("TEST");
        }, 3).fail(function(ex) {
            cur.should.eql(3);
            done();
        });
    });

    it('Retry Promise Fail', function(done) {
        var cur = 0;
        loop.retry(function() {
            cur++;
            var defer = Q.defer();
            setTimeout(function() {
                if (cur > 10) {
                    defer.resolve(cur);
                }
                defer.reject(new Exception("TEST"));
            }, 10);
            return defer.promise;
        }, 3).fail(function(ex) {
            ex.name.should.eql("TEST");
            cur.should.eql(3);
            done();
        });
    });
});
