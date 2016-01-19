var Q = require("q");
var logger = require("./logger");
var Exception = require("./exception");

function promise(value) {
    if (typeof value === "function") {
        return Q.Promise(function(resolve, reject) {
            try {
                var ret = value();
                resolve(ret);
            } catch (err) {
                reject(new Exception(err));
            }
        }).fail(function(err) {
            throw new Exception(err);
        });
    } else {
        return Q(value);
    }
}

module.exports = promise;

if (require.main == module) {}
