var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var Scheduler = common.Scheduler;

var Promise = require("bluebird");


describe('Scheduler', function() {
    // it('Finish All', function(done) {
    //     var scheduler = new Scheduler(10);
    //     var i = 0;

    //     function func() {
    //         i++;
    //     }
    //     scheduler.exec(func).done(function() {});
    //     scheduler.exec(func).done(function() {});
    //     scheduler.exec(func).done(function() {});
    //     scheduler.exec(func).done(function() {});
    //     scheduler.exec(func).done(function() {
    //         scheduler.stop();
    //         scheduler.running.should.eql(0);
    //         i.should.eql(5);
    //         done();
    //     });
    //     scheduler.start();
    // });
    it('Limit', function(done) {
        var scheduler = new Scheduler(3);
        cur = 0;

        function f() {
            logger.log("run");
            logger.log(scheduler.running);
            cur++;
            if (3 < cur && cur < 8) {
                // scheduler.running.should.eql(3);
            }
            return Promise.delay(1000);
        }
        for (var i = 0; i < 10; i++) {
            scheduler.exec(f).done();
        }
        scheduler.once().done(function() {
            logger.log("DONE???");
            done();
        })
    });
});
