const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./../models/db');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const GOOGLE_CLIENT_ID = '302101047993-r6vfl9afm5p839b1bkr7pbdmck32j2na.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

// Configure passport with Google OAuth
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, cb) => {
    // This function handles Google OAuth authentication logic
    // Create or find user in Firebase
    // Return user data to the callback function
  }
));

app.use(passport.initialize());

// Handle Google OAuth callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect or respond with JWT token
  });

// Route for displaying the login form
exports.login=(req, res) => {
  res.send(`
    <html>
      <head>
        <title>Login</title>
      </head>
      <body>
        <h1>Login</h1>
        <form action="/login" method="post">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required>
          <br>
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" required>
          <br>
          <button type="submit">Login</button>
        </form>
      </body>
    </html>
  `);
};

// Route for processing login data
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Authenticate user using Firebase Authentication
  // Handle authentication result
});

// Route for displaying the sign-up form
app.get('/signup', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Sign Up</title>
      </head>
      <body>
        <h1>Sign Up</h1>
        <form action="/signup" method="post">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required>
          <br>
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" required>
          <br>
          <button type="submit">Sign Up</button>
        </form>
      </body>
    </html>
  `);
});

// Route for processing sign-up data
app.post('/signup', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Create user using Firebase Authentication
  // Handle user creation result
});
