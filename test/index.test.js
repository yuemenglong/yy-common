var should = require("should");

var common = require("../index")
var logger = common.logger;
var HttpClient = common.HttpClient;

var client = new HttpClient();
client.get("http://www.baidu.com").done();
