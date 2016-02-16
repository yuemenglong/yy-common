var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;


describe('Exception', function() {
    it('Trans Error To Exception', function(done) {
        try {
            a.b = 1;
        } catch (err) {
            var ex = new Exception(err);
            // logger.log(JSON.stringify(ex));
            ex.name.should.eql(err.name);
            ex.message.should.eql(err.message);
            ex.stack.should.eql(err.stack);
        }
        done();
    });
    it('Return Directly Exception', function(done) {
        try {
            throw new Exception("Test");
        } catch (err) {
            var ex = new Exception(err);
            // logger.log(JSON.stringify(ex));
            ex.name.should.eql("Test");
            ex.should.eql(err);
            ex.stack.should.eql(err.stack);
        }
        done();
    });
    it('Instanceof Error', function(done) {
        try {
            throw new Exception("Test");
        } catch (err) {
            var ex = new Exception(err);
            var belong = ex instanceof Error;
            // logger.log(belong);
            should(belong).eql(true);
        }
        done();
    });
    it('Instanceof Spec Exception', function(done) {
        try {
            throw new Exception("Test");
        } catch (ex) {
            var belong = ex instanceof Exception.Type("Test");
            should(belong).eql(true);
        }
        done();
    });
    it('Merge Detail', function(done) {
        try {
            throw new Exception("Test", "Message", {
                a: 1,
                b: "hi",
            });
        } catch (ex) {
            ex.name.should.eql("Test");
            ex.message.should.eql("Message");
            ex.a.should.eql(1);
            ex.b.should.eql("hi");
        }
        done();
    });
    it('Merge Detail2', function(done) {
        try {
            throw new Exception("Test", "Message", "detail");
        } catch (ex) {
            ex.name.should.eql("Test");
            ex.message.should.eql("Message");
            ex.detail.should.eql("detail");
        }
        done();
    });
    it('Format And Parse', function(done) {
        var ex = new Exception("TEST_ERROR", "Test Format", {
            a: 1,
            b: "hi",
        });
        var s = Exception.format(ex);
        var err = Exception.parse(s);
        err.name.should.eql(ex.name);
        err.message.should.eql(ex.message);
        err.a.should.eql(ex.a);
        err.b.should.eql(ex.b);
        done();
    });
});
