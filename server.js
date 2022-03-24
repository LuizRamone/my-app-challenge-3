var express = require("express");
var app = express();
app.use(express.json());
const url = require('url');

app.listen(5000, () => {
 console.log("Server running on port 5000");
});

app.get("/url", (req, res, next) => {
  let requestHeaders = req.headers
  res.send(requestHeaders)
 });