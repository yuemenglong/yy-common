var regex = /^function .*?[\s\S]*?\(([\s\S]*?)\)\s*\{([\s\S]*)\}$/;

if (Function.prototype.args === undefined) {
    Function.prototype.args = function() {
        var match = this.toString().match(regex);
        var arg_str = match[1];
        var args = match[1].split(/\s*,\s*/);
        var body = match[2];
        return args;
    }
    Object.defineProperty(Function.prototype, "args", {
        enumerable: false
    });
}

if (Function.prototype.body == undefined) {
    Function.prototype.body = function() {
        var match = this.toString().match(regex);
        var arg_str = match[1];
        var args = match[1].split(/\s*,\s*/);
        var body = match[2];
        return body;
    }
    Object.defineProperty(Function.prototype, "body", {
        enumerable: false
    });
}
