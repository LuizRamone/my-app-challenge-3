# Usage
Open postman/insomnia and navigate to http://localhost:9100/[url] , use yarn startserver to use the local server with a simple get to see the headers coming from the proxy.
Example external url: http://localhost:9100/https://pt.wikipedia.org/wiki/Batman?authorization=true&clientId=user&secret=12345&checkBlackList=true&customHeaderKey=x-content&customHeader=true&customHeaderValue=1234&customHTML=true

# proxy 
in the proxy server i decided to go with a hybrid approach in relation to the customization for the plugins, i have separated
the customizations within a config file(default.json) to handle the array of blacklist, ips not allowed, and a custom HTML that i could
send to the proxied server i have separeted like this to not polute the url parameters with a lot of things,

the second parameter on the url(http://localhost:9100/[url]) is the target server that the proxy will redirect to and then 
only thing to do is add the parameters to customize the plugins, here are the list of the available plugins that i have added

# parameters for the plugins
* queryObject.pathRewrite -> this plugin allows the proxy to change some part of the requested url that the proxy will redirect to.(ex: pathRewrite=true)
* queryObject.authorization -> this plugin will add basic authorization headers into the options and send them to the proxied server. (ex authorization=true, with clientId=user and secret=12345  )
* queryObject.customHeader -> this plugin is to add a custom header to the request. (customHeader=true with customHeaderKey=x-content and customHeaderValue=123)
* queryObject.checkBlackList -> this plugin is to check if the host is in blacklist (added on the config file) and if it does send a message and finish the request(checkBlackList=true)
* queryObject.customHTML -> this plugin is to write a custom html in the page (also located at the config file) *dont work in some hosts* (customHTML=true)



localserver could also be used to see the response with the command startserver -> localhost:5000/url
and also a checkSecurity function that is fired when an ip is in the not allowed ip list
