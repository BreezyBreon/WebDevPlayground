//jshint esversion:6 for test

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// Passport documentation
app.use(session({
	secret: "Cravings deal for the win.",
	resave: false,
	saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection

mongoose.connect("mongodb+srv://BreezyBreon:breon20@mentorxlive-ksc8f.gcp.mongodb.net/mentorxdb?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema ({
  fname: String,
  lname: String,
  email: String,
  password: String
  }, {
    collection: 'user'
  });

// Passport heavy lifting to salt and hash encrypted information
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// passport local mongoose
// Serialise allows cookies and deserialize removes cookie
passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req,res){
    res.render("splash");
});


app.get("/login", function(req,res){
    res.render("login");
});

app.get("/homepage", function(req,res){
  if (req.isAuthenticated()){
     res.render("homepage")
  } else {
    res.redirect ("login")
  }
});


app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});


app.get("/register", function(req, res){
	res.render("register")
});


app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
      res.redirect("/homepage");
          const user = new User ({
          fname: req.body.fname,
          lname: req.body.lname,
          email: req.body.username,
          password: req.body.password
          });
      })
    }
  });
 });


app.post("/login", function(req, res){
  const user = new User ({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/homepage");
      });
    }
  });
});


let port = process.env.PORT;
  if (port == null || port =="") {
    port = 3000;
  }

app.listen(port, function() {
    console.log("Server started Successfully");
});


