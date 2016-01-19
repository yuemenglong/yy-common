var loop = require("../loop");
var logger = require("../logger");
var Q = require("q");
var should = require("should");
var Exception = require("../exception")
var promise = require("../promise");


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
            ex.err.should.eql(10);
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
            ex.err.should.eql(10);
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
            ex.err.should.eql(10);
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
            ex.err.should.eql(10);
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
            ex.err.should.eql(10);
            cur.should.eql(2);
            done();
        }).done();
    });
});

describe('Retry', function() {
    it('Retry Return Succ', function(done) {
        var cur = 0;
        loop.retry(function(data) {
            cur++;
            data.should.eql(1);
            if (cur > 3) {
                return data + 2;
            }
            throw data + 1;
        }, 1).done(function(data) {
            data.should.eql(3);
            cur.should.eql(4);
            done();
        });
    });

    it('Retry Promise Succ', function(done) {
        var cur = 0;
        loop.retry(function(data, loop) {
            cur++;
            data.should.eql(1);
            var defer = Q.defer();
            setTimeout(function() {
                if (cur > 3) {
                    defer.resolve(data + 2);
                }
                defer.reject(data + 1);
            }, 10);
            return defer.promise;
        }, 1).done(function(data) {
            data.should.eql(3);
            cur.should.eql(4);
            done();
        });
    });

    it('Retry Max Times', function(done) {
        var cur = 0;
        loop.retry(function(data) {
            cur++;
            data.should.eql(1);
            if (cur > 10) {
                return data + 2;
            }
            throw data + 1;
        }, 1, 3).fail(function(ex) {
            ex.err.should.eql(2);
            cur.should.eql(3);
            done();
        });
    });

    it('Retry Promise Fail', function(done) {
        var cur = 0;
        loop.retry(function(data) {
            cur++;
            data.should.eql(1);
            var defer = Q.defer();
            setTimeout(function() {
                if (cur > 10) {
                    defer.resolve(data + 2);
                }
                defer.reject(data + 1);
            }, 10);
            return defer.promise;
        }, 1, 3).fail(function(ex) {
            ex.err.should.eql(2);
            done();
        });
    });
});
