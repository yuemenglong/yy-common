var loop = require("../loop");
var logger = require("../logger");
var Q = require("q");
var should = require("should");


describe('Loop', function() {
    it('Repeat Return Value', function(done) {
        loop.repeat(function(data) {
            if (data >= 10) {
                loop.brk(data);
            }
            return data + 1;
        }, 1).then(function(data) {
            data.should.eql(10);
            done();
        }).done();
    });
});

describe('Loop', function() {
    it('Repeat Return Loop Promise', function(done) {
        loop.repeat(function(data) {
            var defer = loop.defer();
            setTimeout(function() {
                if (data >= 10) {
                    defer.brk(data);
                } else {
                    defer.cont(data + 1);
                }
            }, 10)
            return defer.promise;
        }, 1).then(function(data) {
            data.should.eql(10);
            done();
        }).done();
    });
});



describe('Loop', function() {
    it('Repeat Return Promise Only Fail', function(done) {
        loop.repeat(function(data) {
            var defer = loop.defer();
            setTimeout(function() {
                if (data >= 10) {
                    defer.reject(data);
                } else {
                    defer.resolve(data + 1);
                }
            }, 10)
            return defer.promise;
        }, 1).fail(function(ex) {
            should(ex.err).eql(10);
            done();
        }).done();
    });
});

describe('Loop', function() {
    it('Repeat Return Undefined', function(done) {
        var cur = 0;
        loop.repeat(function(data) {
            cur++;
            data.should.eql(1);
            if (cur > 10) {
                loop.brk(10);
            }
            return;
        }, 1).done(function(data) {
            data.should.eql(10);
            done();
        });
    });
});

describe('Loop', function() {
    it('Retry Return Succ', function(done) {
        var cur = 0;
        loop.retry(function(data) {
            cur++;
            data.should.eql(1);
            if (cur > 10) {
                return data + 2;
            }
            throw data + 1;
        }, 1).done(function(data) {
            data.should.eql(3);
            done();
        });
    });
});

describe('Loop', function() {
    it('Retry Promise Succ', function(done) {
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
        }, 1).done(function(data) {
            data.should.eql(3);
            done();
        });
    });
});

describe('Loop', function() {
    it('Retry Return Fail', function(done) {
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
            done();
        });
    });
});

describe('Loop', function() {
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
