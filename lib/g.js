var logger = require("./logger");

var g = {
    debugLog: false,
}

g.debug = function() {
    if (g.debugLog) {
        logger.debug.apply(logger, arguments);
    }
}

module.exports = g;