const express = require("express");
const bodyParser = require('body-parser');
const app = express()
let state = "waiting..."
let colours = []
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Handling GET /hello request
app.get("/waiting", (req, res, next) => { //waiting not currently in use but will incorporate for knowing when three players have joined
   console.log('waiting...', req.socket.remoteAddress);
  res.send(state);
 })

app.get('/colour', (req, res) => { //get request 
  res.send(JSON.stringify(colours));
});
app.post('/colour', (req, res) => { //post request 
  console.log('in colour', req.body);
  colours.push(req.body);
  res.send(JSON.stringify(colours));
});
// Server setup
app.listen(3000, () => {
    console.log("Server is Running")
})