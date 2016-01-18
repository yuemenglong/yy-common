var fs = require("fs");

var logger = require("tracer").console({
    transport: function(data) {
        console.log(data.output);
        fs.open('./app.log', 'a', 0666, function(e, fd) {
            fs.write(fd, data.output + "\n", null, 'utf8', function() {
                fs.close(fd, function() {});
            });
        });
    }
});

module.exports = logger;