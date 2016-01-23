Object.proto("clone", function() {
    return JSON.parse(JSON.stringify(this));
});

function concat(a, b) {
    if (typeof a == "object" && typeof b == "object") {
        var ret = a.clone();
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                ret[i] = concat(ret[i], b[i]);
            }
        }
        return ret;
    } else {
        return b;
    }
}
Object.proto("concat", function(obj) {
    return concat(this, obj);
});

Object.proto("array", function() {
    if (typeof this === "array") {
        return this;
    }
    if (this.length === undefined) {
        return undefined;
    }
    var ret = [];
    for (var i = 0; i < this.length; i++) {
        ret.push(this[i]);
    }
    return ret;
});
