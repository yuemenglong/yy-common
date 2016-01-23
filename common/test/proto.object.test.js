var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;

describe('Object', function() {
    it('Concat', function(done) {
        var a = {
            a: 1
        };
        var b = {
            b: 2
        };
        var c = a.concat(b);
        c.should.eql({
            a: 1,
            b: 2,
        })
        done();
    });

    it('Array', function(done) {
        function A(a, b, c) {
            arguments.array().should.eql([1, 2, 3]);
        }
        A(1, 2, 3);
        should("a".array()).eql(undefined);
        done();
    });
});
