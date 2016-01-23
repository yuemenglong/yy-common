var regex = /^function .*?[\s\S]*?\(([\s\S]*?)\)\s*\{([\s\S]*)\}$/;

function set_proto_func(obj, name, func) {
    if (obj.prototype[name] !== undefined) {
        throw new Error("Func Already Exists, " + name);
        // return;
    }
    obj.prototype[name] = func;
    Object.defineProperty(obj.prototype, name, {
        enumerable: false
    });
}

set_proto_func(Function, "proto", function(name, func) {
    set_proto_func(this, name, func);
});

Function.proto("args", function() {
    var match = this.toString().match(regex);
    var arg_str = match[1];
    var args = match[1].split(/\s*,\s*/);
    var body = match[2];
    return args;
});

Function.proto("body", function() {
    var match = this.toString().match(regex);
    var arg_str = match[1];
    var args = match[1].split(/\s*,\s*/);
    var body = match[2];
    return body;
});
