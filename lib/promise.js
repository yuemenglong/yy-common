var logger = require("./logger");
var Exception = require("./exception");
var Promise = require("bluebird");

function promise(value) {
    if (typeof value === "function") {
        return Promise.try(value).catch(function(err) {
            throw new Exception(err);
        });
    } else {
        return Promise.resolve(value);
    }
}

module.exports = promise;

if (require.main == module) {}
