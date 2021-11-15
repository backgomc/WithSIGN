const express = require("express");
const app = express();
const path = require("path");
const cors = require('cors')
const logger = require('morgan');

const cookieParser = require("cookie-parser");

const config = require("./config/key");

const mongoose = require("mongoose");
const connect = mongoose.connect(config.mongoURI,
// const connect = mongoose.connect("mongodb://mongo/nhsign",   // docker 로 붙을때 container name 으로 통신
  {
    useNewUrlParser: true, useUnifiedTopology: true,
    useCreateIndex: true, useFindAndModify: false
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

app.use(cors())
app.use(logger('dev'));

app.use(express.static('public'));

//to not get any deprecation warning or error
//support parsing of application/x-www-form-urlencoded post data
app.use(express.urlencoded({ extended: true }));
//to get json data
// support parsing of application/json type post data
app.use(express.json({limit: '10mb'}));
app.use(cookieParser());

// storage access
app.use(express.static(__dirname, { dotfiles: 'allow' } ));

app.use('/api/users', require('./routes/users'));
app.use('/api/document', require('./routes/document'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/template', require('./routes/template'));
app.use('/api/sign', require('./routes/sign'));
app.use('/api/bulk', require('./routes/bulk'));
app.use('/api/board', require('./routes/board'));
app.use('/api/admin', require('./routes/admin'));

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {

  // Set static folder
  app.use(express.static("client/build"));

  // index.html for all page routes
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client", "build", "index.html"));
  });
}

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log(`Server Running at ${port}`)
});

const batch = require('./common/batch');
batch.orgSyncJob.start();
batch.userSyncJob.start();