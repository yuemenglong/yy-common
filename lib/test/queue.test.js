var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var Queue = common.Queue;


describe('Queue', function() {
    it('Push Then Pop', function(done) {
        var queue = new Queue();
        queue.push(1);
        queue.push(2);
        queue.pop().then(function(res) {
            res.should.eql(1);
        }).done();
        queue.pop().then(function(res) {
            res.should.eql(2);
            done();
        }).done();
    });
    it('Pop Then Push', function(done) {
        var queue = new Queue();
        queue.pop().then(function(res) {
            res.should.eql(1);
        }).done();
        queue.pop().then(function(res) {
            res.should.eql(2);
            done();
        }).done();
        queue.push(1);
        queue.push(2);
    });
});
