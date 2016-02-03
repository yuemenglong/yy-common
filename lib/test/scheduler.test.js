var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var Scheduler = common.Scheduler;

var Promise = require("bluebird");


describe('Scheduler', function() {
    it('Finish All', function(done) {
        var scheduler = new Scheduler(10);
        var i = 0;

        function func() {
            i++;
        }
        scheduler.exec(func).done(function() {});
        scheduler.exec(func).done(function() {});
        scheduler.exec(func).done(function() {});
        scheduler.exec(func).done(function() {});
        scheduler.exec(func).done(function() {
            scheduler.stop();
            scheduler.running.should.eql(0);
            i.should.eql(5);
            done();
        });
        scheduler.start();
    });

    it('Limit', function(done) {
        var scheduler = new Scheduler(3);
        cur = 0;

        function f() {
            return Promise.delay(100).then(function() {
                cur++;
                should(cur <= 3).be.ok;
                should(scheduler.running <= 3).be.ok;
            });
        }
        for (var i = 0; i < 10; i++) {
            scheduler.exec(f).done(function() {
                cur--;
                should(cur <= 3).be.ok;
            });
        }
        scheduler.once().done(function() {
            done();
        })
    });
    it('Sleep', function(done) {
        var scheduler = new Scheduler(3, 100);
        cur = 0;

        function f() {
            cur++;
        }
        for (var i = 0; i < 10; i++) {
            scheduler.exec(f).done(function() {
                // logger.log("ok");
            });
        }
        scheduler.once().done(function() {
            cur.should.eql(10);
            done();
        })
    });
});
