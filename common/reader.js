var logger = require("./logger");
var Exception = require("./exception");

function Reader(data, win) {
    if (typeof data != "string") {
        throw new Exception("Reader Need String Param");
    }
    var _data = data;
    var _regex = /^(.*)\n/;
    if (win) {
        _regex = /^(.*)\r\n/;
    }

    this.readline = function() {
        if (!_data.length) {
            return undefined;
        }
        // _regex = /.*/;
        var match = _data.match(_regex);
        if (match) {
            _data = _data.substr(match[0].length);
            return match[1];
        }
        if (_data.length) {
            var ret = _data;
            _data = "";
            return ret;
        }
        return undefined;
    }
}

module.exports = Reader;

if (require.main == module) {
    var text = `asdf\r
\r
    zxcv`;
    var reader = new Reader(text);
    for (var line = reader.readline(); line != undefined; line = reader.readline()) {
        logger.log(line);
    }
}
