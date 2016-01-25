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
    it('Return Directly Exception In Detail', function(done) {
        try {
            throw new Exception("Test");
        } catch (err) {
            var ex = new Exception("Test", "asdf", err);
            // logger.log(JSON.stringify(ex));
            ex.should.eql(err);
            ex.stack.should.eql(err.stack);
        }
        done();
    });
    it('Return Directly Error In Detail', function(done) {
        try {
            throw new Error("asdf");
        } catch (err) {
            var ex = new Exception("Test", "asdf", err);
            // logger.log(JSON.stringify(ex));
            ex.name.should.eql(err.name);
            ex.message.should.eql(err.message);
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
            belong.should.be.ok;
        }
        done();
    });
});
