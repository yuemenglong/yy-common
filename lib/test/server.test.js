var should = require("should");

var common = require("../..");
var Exception = common.Exception;
var logger = common.logger;
var Server = common.Server;
var Socket = common.Socket;

var PORT = 8080;

function fail() {
    should(false).eql(true);
}

describe('Server', function() {
    it('Open Same Port', function(done) {
        var server = new Server();
        var server2 = new Server();
        server.listen(PORT).catch(function(err) {
            should(true).eql(false);
        }).done();
        server2.listen(PORT).then(function() {
            should(true).eql(false);
        }).catch(function(err) {
            server.close();
            done();
        }).done();
    });
    it('Close Before Listen', function(done) {
        var server = new Server();
        server.close().then(function() {
            fail();
        }).catch(function(err) {
            done();
        }).done();
    });
    it('Close Twice', function(done) {
        var server = new Server();
        server.listen(PORT).then(function() {
            return server.close();
        }).then(function() {
            return server.close()
        }).then(function() {
            fail();
        }).catch(function(err) {
            done();
        }).done();
    });
});
