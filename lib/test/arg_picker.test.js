var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var ArgPicker = common.ArgPicker;


describe('ArgPicker', function() {
    it('First Second', function(done) {
        function F() {
            var picker = new ArgPicker(arguments);
            var fn = picker.first("string");
            var sn = picker.second("string");
            var t = picker.first(T);
            var t2 = picker.rfirst(T);
            var fn2 = picker.rsecond("string");
            fn.should.eql("1");
            sn.should.eql("2");
            t.should.eql(t2);
            fn.should.eql(fn2);

            var t3 = picker.first([T, "number"]);
            t3.should.eql(t);
            var sn2 = picker.rfirst(["string", F]);
            sn2.should.eql(sn);
        }

        function T() {}
        F("1", "2", new T(), 4);
        done();
    });
});
