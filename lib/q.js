var Promise = require("bluebird");
var logger = require("./logger");


Promise.prototype.fail = Promise.prototype.catch;

var Q = {};

Q.defer = function() {
    var ret = {};
    var promise = new Promise(function(resolve, reject) {
        ret.resolve = resolve;
        ret.reject = reject;
    });
    ret.promise = promise;
    return ret;
}

module.exports = Q;
