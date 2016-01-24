var logger = require("../logger");
var should = require("should");
var Time = require("../time");

describe('Time', function() {
    it('Format And Parse', function(done) {
        var t1 = new Time();
        var str = t1.toString();
        console.log(str);
        var t2 = Time.parse(str);
        var str2 = t2.toString();
        console.log(str2);
        str.should.eql(str2);
        done();
    });
    it('Invalid Fix', function(done) {
        var t = new Time(2016, 2, 31);
        var s = t.format("yyyyMMdd");
        s.should.eql("20160302");
        done();
    });
});
