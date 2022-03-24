/*
in the proxy server i decided to go with a hybrid approach in relation to the customization for the plugins, i have separated
the customizations within a config file(default.json) to handle the array of blacklist, ips not allowed, and a custom HTML that i could
send to the proxied server i have separeted like this to not polute the url parameters with a lot of things,

the second parameter on the url(http://localhost:9100/[url]) is the target server that the proxy will redirect to and then 
only thing to do is add the parameters to customize the plugins, here are the list of the available plugins that i have added

* queryObject.pathRewrite -> this plugin allows the proxy to change some part of the requested url that the proxy will redirect to.(ex: pathRewrite=true)
* queryObject.authorization -> this plugin will add basic authorization headers into the options and send them to the proxied server. (ex authorization=true, with clientId=user and secret=12345  )
* queryObject.customHeader -> this plugin is to add a custom header to the request. (customHeader=true with customHeaderKey=x-content and customHeaderValue=123)
* queryObject.checkBlackList -> this plugin is to check if the host is in blacklist (added on the config file) and if it does send a message and finish the request(checkBlackList=true)
* queryObject.customHTML -> this plugin is to write a custom html in the page (also located at the config file) *dont work in some hosts* (customHTML=true)

Usage: Open browser and navigate to http://localhost:9100/[url]
Example: http://localhost:9100/https://pt.wikipedia.org/wiki/Batman?authorization=true&clientId=user&secret=12345&checkBlackList=true&customHeaderKey=x-content&customHeader=true&customHeaderValue=1234&customHTML=true
localserver could also be used to see the response with the command startserver -> localhost:5000/url
and also a checkSecurity function that is fired when an ip is in the not allowed ip list

*/

var url = require("url"),
  http = require("http"),
  https = require("https"),
  util = require("util");

const config = require("config");
//configuration of the port and host in the config file
const PORT = config.get("proxyServer.port");
const HOST = config.get("proxyServer.host");
// configuration of the blacklist, ips not allowed and custom html in config file
const BLACKLIST = config.get("proxyServer.blacklist");
const IP_NOTALLOWED = config.get("proxyServer.ipnotallowed");
const CUSTOM_HTML = config.get("proxyServer.customhtml");

//creation of the http request server
var proxyServer = http.createServer(function (req, res) {
  //get the requested url without the proxy url that will be used as redirect, the substring is to remove the first / off the url
  var reqUrl = req.url.substr(1);
  //object to separate all parameters that was requested in the client
  const queryObject = url.parse(req.url, true).query;

  util.log("URL requested: " + reqUrl + "\n");

  //plugin to change the url on the options object, removing some piece that you dont need
  var options = queryObject.pathRewrite
    ? url.parse(reqUrl.replace(queryObject.pathRewrite, ""))
    : url.parse(reqUrl);
  //options to send in the request
  options.headers = req.headers;
  options.method = req.method;
  options.agent = false;
  options.headers["host"] = options.host;
  //clean the ip to compare with the config file
  var ip = req.connection.remoteAddress.replace("::ffff:", "");
  //plugin to check if the ip is not allowed, and if it is fire the checkSecurity method and end the connection with a not allowed message
  if (IP_NOTALLOWED.indexOf(ip) > -1 && IP_NOTALLOWED != "") {
    let msg = "IP " + ip + " is not allowed to use this proxy";
    checkSecurity(req, res, msg);
    return;
  }

  //plugin to add basic authorization into the options headers with the clientId and secret of the user
  if (queryObject.authorization) {
    options.headers["Authorization"] =
      "Basic " +
      new Buffer(queryObject.clientId + ":" + queryObject.secret).toString(
        "base64"
      );
  }
  //plugin to add a custom header in the options object
  queryObject.customHeader
    ? (options.headers[queryObject.customHeaderKey] =
        queryObject.customHeaderValue)
    : null;
  //creation of the client request with all the options configurations, http and htpps support
  var server = (options.protocol == "https:" ? https : http).request(
    options,
    function (serverResponse) {
      //plugin to check in the request if the host is in blacklist on the config file
      queryObject.checkBlackList
        ? checkBlackList(serverResponse.req)
        : null;
      //utils log to save the actions
      util.log("response: ", serverResponse.statusCode, reqUrl);
      util.log("\t Request Headers -> ", options);
      util.log(" ");
      util.log("\t Response Headers -> ", serverResponse.headers);
      //added cors to the response to allow the server to receive cross-origin requests
      serverResponse.headers["access-control-allow-origin"] = "*";
      //addind the status code and the headers to the response
      res.writeHeader(serverResponse.statusCode, serverResponse.headers);
      //add the content-type text/html if the customhtml parameter is true
      queryObject.customHTML
        ? (serverResponse.headers["content-type"] = "text/html")
        : null;
      //check if there is a customhtml parameter, if it exists then show the html that is on config file
      queryObject.customHTML ? res.write(CUSTOM_HTML) : null;
      // send the response created allowing to pass into the response a readable stream data
      serverResponse.pipe(res);
    }
  );
  //send the request created allowing to pass the readable stream data to the writeable stream, and then end the connection.
  req.pipe(server, { end: true });
});

util.log("Listening on", HOST + ":" + PORT);
proxyServer.listen(PORT);

//security function to valid the ip passed if the ip is not allowed show the security violation message and end the connection
function checkSecurity(request, response, msg) {
  var ip = request.connection.remoteAddress;
  msg =
    "((SECURITY VIOLATION)), " +
    ip +
    "," +
    (request.method || "!NO METHOD!") +
    " " +
    (request.headers.host || "!NO HOST!") +
    "=>" +
    (request.url || "!NO URL!") +
    "," +
    msg;

  util.log(msg);
  //write message to the response
  response.write(msg);
  //end the connection
  response.end();
}
// function do check if the host is in blacklist on the config file and shutdown the connection in the end if it does
function checkBlackList(response) {
  if (BLACKLIST.indexOf(response.host) > -1 && BLACKLIST != "") {
    let msg =
      "The requested host " +
      host +
      " is in Blacklist and it is not allowed to use this proxy";
    util.log(msg);
    //write message to the response
    response.write(msg);
    //end the connection
    response.end();
  }
}
