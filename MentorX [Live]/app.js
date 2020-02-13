//jshint esversion:6 for test

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


app.get("/", function(req,res){
    res.render("splash");
});


app.get("/login", function(req,res){
    res.render("login");
});

let port = process.env.PORT;
  if (port == null || port =="") {
    port = 3000;
  }

app.listen(port, function() {
    console.log("Server started Successfully");
});


