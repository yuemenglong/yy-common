var should = require("should");
// var Q = require("q");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var loop = common.loop;
var Q = common.Q;
var Promise = require("bluebird");

describe('Repeat', function() {
    it('Repeat Return Plain Value', function(done) {
        var cur = 0;
        loop.repeat(function(data, loop) {
            cur++;
            if (data >= 2) {
                loop.brk(10);
            }
            return data + 1;
        }, 1).then(function(data) {
            data.should.eql(10);
            cur.should.eql(2);
            done();
        }).done();
    });

    it('Repeat Return Real Promise (Only Reject Can Break)', function(done) {
        var cur = 0;
        loop.repeat(function(data, loop) {
            var defer = Q.defer();
            cur++;
            setTimeout(function() {
                if (data >= 2) {
                    defer.reject(10);
                } else {
                    defer.resolve(data + 1);
                }
            }, 10);
            return defer.promise;
        }, 1).fail(function(ex) {
            ex.name.should.eql(10);
            cur.should.eql(2);
            done();
        }).done();
    });

    it('Repeat Return Undefined (Means Async)', function(done) {
        var cur = 0;
        loop.repeat(function(data, loop) {
            cur++;
            setTimeout(function() {
                if (data >= 2) {
                    loop.brk(10);
                } else {
                    loop.cont(data + 1);
                }
            }, 10);
        }, 1).then(function(data) {
            data.should.eql(10);
            cur.should.eql(2);
            done();
        }).done();
    });

    it('Repeat Throw Error', function(done) {
        var cur = 0;
        loop.repeat(function(data, loop) {
            cur++;
            if (data >= 2) {
                throw 10;
            } else {
                return data + 1;
            }
        }, 1).fail(function(ex) {
            ex.name.should.eql(10);
            cur.should.eql(2);
            done();
        }).done();
    });

    it('Repeat Promise Reject', function(done) {
        var cur = 0;
        loop.repeat(function(data, loop) {
            var defer = Q.defer();
            setTimeout(function() {
                cur++;
                if (data >= 2) {
                    defer.reject(10);
                } else {
                    defer.resolve(data + 1);
                }
            })
            return defer.promise;
        }, 1).fail(function(ex) {
            ex.name.should.eql(10);
            cur.should.eql(2);
            done();
        }).done();
    });

    it('Repeat Async Except', function(done) {
        var cur = 0;
        loop.repeat(function(data, loop) {
            setTimeout(function() {
                cur++;
                if (data >= 2) {
                    loop.except(10);
                } else {
                    loop.cont(data + 1);
                }
            })
        }, 1).fail(function(ex) {
            ex.name.should.eql(10);
            cur.should.eql(2);
            done();
        }).done();
    });

    it('Repeat Break/Cont Plain Value And No Return', function(done) {
        var cur = 0;
        loop.repeat(function(data, loop) {
            cur++;
            if (data >= 2) {
                loop.brk(10);
                return 100;
            } else {
                loop.cont(data + 1);
            }
        }, 1).then(function(data) {
            data.should.eql(10);
            cur.should.eql(2);
            done();
        }).done();
    });

    it('No Data Param', function(done) {
        var cur = 0;
        var data = 1;
        loop.repeat(function(loop) {
            setTimeout(function() {
                cur++;
                if (data >= 2) {
                    loop.except(10);
                } else {
                    data++;
                    loop.cont();
                }
            })
        }).fail(function(ex) {
            ex.name.should.eql(10);
            cur.should.eql(2);
            done();
        }).done();
    });
});

describe('Retry', function() {
    it('Retry Return Succ', function(done) {
        var cur = 0;
        loop.retry(function() {
            cur++;
            if (cur > 3) {
                return Promise.resolve(cur);
            }
            throw new Error("TEST");
        }).done(function(data) {
            cur.should.eql(4);
            done();
        });
    });

    it('Retry Promise Succ', function(done) {
        var cur = 0;
        loop.retry(function() {
            cur++;
            var defer = Q.defer();
            setTimeout(function() {
                if (cur > 3) {
                    defer.resolve(cur);
                }
                defer.reject(cur);
            }, 10);
            return defer.promise;
        }).done(function(data) {
            cur.should.eql(4);
            done();
        });
    });

    it('Retry Max Times', function(done) {
        var cur = 0;
        loop.retry(function() {
            cur++;
            if (cur > 10) {
                return Promise.resolve(cur);
            }
            throw new Error("TEST");
        }, 3).fail(function(ex) {
            cur.should.eql(3);
            done();
        });
    });

    it('Retry Promise Fail', function(done) {
        var cur = 0;
        loop.retry(function() {
            cur++;
            var defer = Q.defer();
            setTimeout(function() {
                if (cur > 10) {
                    defer.resolve(cur);
                }
                defer.reject(new Exception("TEST"));
            }, 10);
            return defer.promise;
        }, 3).fail(function(ex) {
            ex.name.should.eql("TEST");
            cur.should.eql(3);
            done();
        });
    });
});
