var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var kit = common.kit;

describe('Kit', function() {
    it('Format', function(done) {
        var s = kit.format("%02d, %d, %s, %02s", 2, 2, "xx", "end");
        s.should.eql("02, 2, xx, %02s end");
        done();
    });
})
