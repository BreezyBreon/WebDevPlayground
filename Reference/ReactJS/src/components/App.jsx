import React from "react";
import Express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

import ReactDom from "react-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import Note from "./Note.jsx";


mongoose.connect("mongodb+srv://admin-breezy:LDfhTt0oXw7u4XyF@cluster0-nr3qq.mongodb.net/mentorxdb", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = {
  firstName: String,
  lastName: String,
  emailAddress: String,
  password: String
};

const User = mongoose.model("User", userSchema);


app.get("/login", function(req, res){
  res.render("login");
});

app.post("/login", function(req, res){
});

app.post("/signup", function(req, res){
  const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      emailAddress: req.body.emailAddress,
      password: req.body.password
  });

  user.save(function(err){
    if (!err){
        res.redirect("/homepage");
    }
  });
});


app.get("/", function(req,res){
    res.render("splash");
});

app.get("/login", function(req,res){
    res.render("testLogin");
});

app.get("/registration", function(req,res){
    res.render("registration");
});

app.get("/homepage", function(req,res){
    res.render("HomePage");
});

let port = process.env.PORT;
  if (port == null || port =="") {
    port = 3000;
  }

app.listen(port, function() {
    console.log("Server started Successfully");
});


export default App;