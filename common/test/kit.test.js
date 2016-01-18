var loop = require("../loop");
var logger = require("../logger");
var Q = require("q");
var assert = require('assert');
var kit = require("../kit");

require("should");

describe('Kit Concat', function() {
    it('Concat Object', function(done) {
        var a = {
            a: 1
        };
        var b = {
            b: 2
        };
        var c = kit.concat(a, b);
        assert.equal(c.a, 1);
        assert.equal(c.b, 2);
        // logger.log(c);
        done();
    });
    it('Concat Array', function(done) {
        var a = {
            a: [1]
        };
        var b = {
            a: [2]
        };
        var c = kit.concat(a, b);
        c.a.should.eql([1, 2]);
        // logger.log(c);
        done();
    });
    it('Concat Sub Object', function(done) {
        var a = {
            a: {
                a: 1
            }
        };
        var b = {
            a: {
                b: 2
            }
        };
        var c = kit.concat(a, b);
        c.a.should.eql({
            a: 1,
            b: 2
        });
        // logger.log(c);
        done();
    });
});

describe('Kit Copy', function() {
    it('Copy Object', function(done) {
        var a = {
            a: 1,
            b: 2
        }
        var b = kit.copy(a);
        b.should.eql(a);
        done();
    });

});
