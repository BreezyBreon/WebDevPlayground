    //jshint esversion:6 for test


// dontenv files won't commit to github - need locally installed
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const GoogleStrategy = require ('passport-google-oauth20').Strategy;
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

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true})
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema ({
  googleID: String,
  linkedinID: String,
  fname: String,
  lname: String,
  email: String,
  username: String,
  profilePicture: String,
  password: String
  }, {
    collection: 'user'
  });

  //user profile data




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


// LinkedIn OAuth Passport Strategy
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_ID,
  clientSecret: process.env.LINKEDIN_SECRET,
  // add mLab package to Heroku to enable datbase link to MongoDB
  // callbackURL: "https://mentorx.live/auth/LinkedIn/callback",
  // callbackURL: "https://mentorx-live.herokuapp.com/auth/LinkedIn/callback",
  callbackURL: "http://localhost:3000/auth/LinkedIn/callback",
  scope: ['r_emailaddress', 'r_liteprofile'],
  state: true
}, function(accessToken, refreshToken, profile, done) {
    const profileData = JSON.parse(profile._raw);
    const email = profile.emails[0].value;
    const firstName = profileData.firstName.localized.en_US;
    const lastName = profileData.lastName.localized.en_US;
    const profilePicture = profile.photos[2].value;
    console.log(profile)
    User.findOrCreate({ linkedinID: profile.id }, function (err, user) {
    User.updateOne({linkedinID: profile.id}, {$set: {
          fname: firstName,
          lname: lastName,
          email: email,
          username: email,
          profilePicture: profilePicture
      }}, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Success!")
      }
    });
      return done(err, user);
    });
}));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://mentorx-live.herokuapp.com/auth/google/callback",
  // callbackURL: "http://localhost:3000/auth/google/callback",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
}, function(accessToken, refreshToken, email, profile, cb) {
    const firstName = profile._json.given_name;
    const lastName = profile._json.family_name;
    const gmail = profile._json.email;
    const profilePicture = profile._json.picture;
    User.findOrCreate({ googleID: profile.id }, function (err, user) {
    User.updateOne({googleID: profile.id}, {$set: {
      fname: firstName,
      lname: lastName,
      email: gmail,
      username: gmail,
      profilePicture: profilePicture
      }}, function(err){
      if (err){
        console.log(err);
      } else {
        console.log("Success!")
      }
    });
      return cb(err, user);
    });
}));




app.get("/", function(req,res){
    res.render("splash");
});

app.get("/login", function(req,res){
    res.render("login");
});


app.get("/home", function(req,res){
    if (req.isAuthenticated()){
     res.render("home", {user: req.user})
      } else {
    res.redirect ("/")
    }
});


app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});


app.get("/register", function(req, res){
	res.render("register")
});

app.get("/myprofile", function(req, res){
	res.render("myprofile")
});

app.get("/test", function(req, res){
  
  User.find( function(err, users) {
    if (err) {
      console.log(err);
    } else {
      res.render("test", {user: users})
    }});
});


// Authentication requests for Linkedin OAuth
app.get('/auth/linkedin',
  passport.authenticate('linkedin'),
  function(req, res){
});

app.get('/auth/LinkedIn/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
});

// Authentication requests for Google OAuth
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
  );

app.get("/auth/google/callback",
  passport.authenticate("google", {failureRedirect: "/login"}),
  function(req, res){
    res.redirect("/home");
  });

// Add check for user already registered
// Add registration through Google



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
		res.redirect("/home");
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
        res.redirect("/home");
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
