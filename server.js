var common = require(".");
var Server = common.Server;

var server = new Server();

server.listen(80).then(function() {
    return server.accept();
}).then(function(socket) {
	return socket.close();
}).then(function() {
	
}).catch(function(err) {
    logger.error(err);
}).done();

//close -> peer read undefined
// 