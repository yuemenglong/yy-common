var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;

describe('Date', function() {
    it('Format', function(done) {
        var d = new Date(2015, 6, 18, 11, 23, 06);
        d.$format().should.eql("2015-07-18 11:23:06");
        done();
    });
    it('Parse', function(done) {
        var d = new Date(2015, 6, 18, 11, 23, 06);
        var s = d.$format();
        var d2 = Date.$parse(s);
        d2.$format().should.eql(s);
        done();
    });
    it('New', function(done) {
        var d = Date.$new(2015, 6, 18, 11, 23, 06);
        d.$format().should.eql("2015-06-18 11:23:06");
        done();
    });
});
