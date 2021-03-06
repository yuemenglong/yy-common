var clone = require('clone');

Object.$proto("$clone", function() {
    // return JSON.parse(JSON.stringify(this));
    return clone(this);
});

function concat(a, b) {
    if (typeof a == "object" && typeof b == "object") {
        var ret = a.$clone();
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
Object.$proto("$concat", function(obj) {
    return concat(this, obj);
});

Object.$proto("$array", function() {
    if (Array.isArray(this)) {
        return this;
    }
    if (this.constructor === Object && this.length !== undefined) {
        return Array.prototype.slice.apply(this)
    } else if (this.constructor === Object) {
        var ret = [];
        for (var i in this) {
            if (this.hasOwnProperty(i) && typeof(this[i]) !== "function") {
                ret.push(this[i]);
            }
        }
        return ret;
    } else {
        return undefined;
    }
});

Object.$proto("$keys", function() {
    var ret = [];
    for (var i in this) {
        if (this.hasOwnProperty(i)) {
            ret.push(i);
        }
    }
    return ret;
})

Object.$proto("$values", function() {
    var ret = [];
    for (var i in this) {
        if (this.hasOwnProperty(i)) {
            ret.push(this[i]);
        }
    }
    return ret;
})
