var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;

describe('Function', function() {
    it('Args/Body', function(done) {
        function A(a, b, cb) {
            return a + b;
        }
        A.args().should.eql(["a", "b", "cb"]);
        A.body().replace(/\s+/g, "").should.eql("returna+b;");
        done();
    });
});
