var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var fx = common.fx;


describe('Func', function() {
    it('Decorate', function(done) {
        var a = 0;

        function Orig(i) {
            a = i;
        }
        var f = fx.decorate(Orig, function(i, orig) {
            i++;
            orig(i);
        });
        f(10);
        a.should.eql(11);
        done();
    });

    it('Decorate Prototype', function(done) {
        function A() {}
        A.prototype.get = function() {
            return 1;
        }
        var a = new A();
        a.get = fx.decorate(a.get, function(orig) {
            return orig() + 1;
        });
        var ret = a.get();
        ret.should.eql(2);
        done();
    });
});
