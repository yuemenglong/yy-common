var kit = require("./kit");
var fx = require("./fx");
var util = require("util");
var log4js = require('log4js');
// log4js.loadAppender('file');

kit.mkdirSync("logs");
var overload = function(of, nf) {
    return function() {
        if (arguments.length == nf.length) {
            return nf.apply(this, arguments);
        } else {
            return of.apply(this, arguments);
        }
    }
}
var ext = function() {
    var info = kit.stackInfo(9);
    return util.format("%s:%d", info.file, info.line);
}
var layout = {
    type: 'pattern',
    pattern: "%[[%d %p] - %]%m%[ - %x{ext}%]",
    tokens: {
        ext: ext,
    }
}
log4js.configure({
    appenders: [{
        type: 'console',
        layout: {
            type: 'pattern',
            pattern: "%[[%d %p] [%x{ext}] - %m%]",
            tokens: {
                ext: ext,
            }
        },
    }, {
        type: "dateFile",
        filename: "logs/app.log",
        pattern: "-yyyy-MM-dd",
        alwaysIncludePattern: false,
        layout: {
            type: 'pattern',
            pattern: "[%d %p] - %m - %x{ext}",
            tokens: {
                ext: ext,
            }
        },
    }]
});
var logger = log4js.getLogger();
// logger.log = overload(logger.log, function(msg) {
//     logger.mark(msg);
// });
logger.log = logger.mark;

module.exports = logger;


// logger.trace("trace");
// logger.debug("debug");
// logger.info("info");
// logger.warn("warn");
// logger.error("error");
// logger.fatal("fatal");
// logger.mark("mark");
