var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var fx = common.fx;


describe('Fx', function() {
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
        A.prototype.get = function(a, b, c) {
            return 1;
        }
        var a = new A();
        a.get = fx.decorate(a.get, function(a, b, c, $orig) {
            return $orig(a, b, c) + 1;
        });
        var ret = a.get();
        ret.should.eql(2);
        done();
    });

    it('Overload', function(done) {

        function Orig(i) {
            return i;
        }
        var f = fx.overload(Orig, function(i, j) {
            return i + j;
        });
        f(10).should.eql(10);
        f(10, 3).should.eql(13);
        done();
    });

    it('Deferize', function(done) {
        function func(err, res, cb) {
            setTimeout(function() {
                return cb(err, res);
            }, 10);
        }
        var f = fx.deferize(func);
        f(null, 4).then(function(res) {
            res.should.eql(4);
        }).done();
        f(new Exception("TEST"), 4).then(function(res) {
            false.should.be.ok;
        }).fail(function(err) {
            err.name.should.eql("TEST");
        }).done(function() {
            done();
        });
    });

    it('Deferize2', function(done) {
        function func(err, res, callback) {
            setTimeout(function() {
                return callback(err, res);
            }, 10);
        }
        var f = fx.deferize(func);
        f(null, 4).then(function(res) {
            res.should.eql(4);
        }).done();
        f(new Exception("TEST"), 4).then(function(res) {
            false.should.be.ok;
        }).fail(function(err) {
            err.name.should.eql("TEST");
        }).done(function() {
            done();
        });
    });
});
