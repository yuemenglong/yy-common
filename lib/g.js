var logger = require("./logger");

var g = {
    debugLog: false,
    stackTrace: false;
}

g.debug = function() {
    if (g.debugLog) {
        logger.debug.apply(logger, arguments);
    }
}

g.printStackTrace = function(err) {
    if (g.stackTrace) {
        logger.error(err);
    }
}

module.exports = g;
