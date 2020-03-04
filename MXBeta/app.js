//jshint esversion:6 for test

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));


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
  linkedinID: String,
  email: String,
  password: String
  }, {
    collection: 'user'
  });

// Passport heavy lifting to salt and hash encrypted information
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// passport local mongoose
// Serialise allows cookies and deserialize removes cookie
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_ID,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: "http://localhost:3000/auth/LinkedIn/callback",
  scope: ['r_emailaddress', 'r_liteprofile'],
  state: true
}, function(accessToken, refreshToken, profile, done) {
    const profileData = JSON.parse(profile._raw)
    console.log(profile.emails);
    const firstName = profileData.firstName.localized.en_US;
    const lastName = profileData.lastName.localized.en_US;
    User.findOrCreate({ linkedinID: profile.id }, function (err, user) {
      return done(err, user);
    });

    User.updateOne({linkedinID: profile.id}, {$set: {
          fname: firstName,
          lname: lastName,
      }}, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Success!")
      }
    });

}));

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

  User.find({"fname": {$ne: null}}, function(err, foundUsers){
    if (err) {
      console.log(err);
    } else {
      if (foundUsers){
        res.render("homepage", {userInformation: foundUsers});
      }
    }
  });
});


app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});


app.get("/register", function(req, res){
	res.render("register")
});


app.get('/auth/linkedin',
  passport.authenticate('linkedin'),
  function(req, res){
});

app.get('/auth/linkedin/callback', 
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});



// Add check for user already registered
// Add registration through LinkedIn, Google & Facebook



app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
      	User.updateOne({username: req.body.username}, {$set: {
      		fname: req.body.fname,
      		lname: req.body.lname,
      		email: req.body.username
  		}}, function(err){
			if (err){
				console.log(err);
			} else {
				console.log("Success!")
			}
		});
		res.redirect("/homepage");
      })
    }
  });
});


// Check to see if user is already registered through traditional user registration
app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      return("Incorrect login or password");
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


