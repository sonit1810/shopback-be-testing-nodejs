
const config = require('./config');
const express = require('express');
const app = express();
const routes = require('./routes/user');

bodyParser = require('body-parser');
bodyParser.urlencoded({extended: true});

//avoid return json parsing error to result
app.use((req, res, next) => {
  bodyParser.json()(req, res, err => {
    if (err) {
      console.error(err);
      //bad request
      return res.sendStatus(400);
    }
    next();
  });
});

//set routes
routes(app);

app.listen(config.port, () => {
  console.log("Server is running on port " + config.port);
});