var util = require("util");
var net = require("net");
var Promise = require("bluebird");

var Socket = require("./socket");
var logger = require("./logger");
var Exception = require("./exception");

module.exports = Server;

function Server() {
    this.server = new net.Server();
}

Server.prototype.listen = function(port) {
    var that = this;
    return new Promise(function(resolve, reject) {
        that.listen(port, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    })
}

Server.prototype.accept = function() {
    
}

if (require.main == module) {

}
