// Signin Validator
const validator = require('./middlewares/signinValidator');
// signup validator
const signupValidator = require('./middlewares/signupValidator');
// password reset validator
const passwordResetValidator = require('./middlewares/passwordResetValidator');
// password reset token validator
const checkResetToken = require('./middlewares/verifyResetToken');
// User Routes
const users = require('../app/controllers/users');
// Answer Routes
const answers = require('../app/controllers/answers');
// Question Routes
const questions = require('../app/controllers/questions');
// Notification Routes
const notifications = require('../app/controllers/notification');
// Avatar Routes
const avatars = require('../app/controllers/avatars');
// Home route
const index = require('../app/controllers/index');
// Game controllers
const games = require('../app/controllers/games');
// Authorization controller
const authorization = require('./middlewares/tokenVerifier');

// const async = require('async');

module.exports = (app, passport, auth) => { // eslint-disable-line no-unused-vars
  app.get('/signin', users.signin);
  app.get('/signup', users.signup);
  app.get('/chooseavatars/', users.checkAvatar);
  app.get('/signout', users.signout);
  // Setting up the users api
  app.post('/users', users.create);
  app.post('/users/avatars', users.avatars);
  // Route to register a user.
  app.post(
    '/api/validator',
    signupValidator.userSignup,
    users.validator
  );

  app.post(
    '/api/auth/signup', signupValidator.userSignup,
    users.finishUserSignup
  );

  app.put(
    '/api/auth/passwordreset',
    checkResetToken.resetToken,
    passwordResetValidator.resetPassword,
    users.resetPassword
  );
  // Route to search for users
  app.post('/api/search/users', users.search);

  // Route to send invites
  app.post('/api/invite/users', users.invites);
  // Route to send password reset link
  app.post(
    '/api/sendresetlink', passwordResetValidator.sendResetLink,
    users.sendResetMail
  );
  // Route to reset password
  app.get(
    '/resetpassword/:token',
    checkResetToken.verifyResetToken,
    users.resetCallback,
    users.resetPassword
  );

  // Donation Routes
  app.post('/donations', users.addDonation);

  app.post('/api/auth/login', validator.signin, passport.authenticate('local', {
    // failureRedirect: '/signin',
  }), users.login);

  app.get('/users/me', users.me);
  app.get('/users/:userId', users.show);

  // Setting the facebook oauth routes
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['email'],
    successRedirect: '/play',
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/play',
    failureRedirect: '/signin'
  }), users.authCallback);

  // Setting the twitter oauth routes
  app.get('/auth/twitter', passport.authenticate('twitter', {
    successRedirect: '/play',
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect: '/play',
    failureRedirect: '/signin'
  }), users.authCallback);

  // Setting the google oauth routes
  app.get('/auth/google', passport.authenticate('google', {
    successRedirect: '/play',
    failureRedirect: '/signin',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }), users.signin);

  app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/play',
    failureRedirect: '/signin'
  }), users.authCallback);

  app.get('/auth/instagram', passport.authenticate('instagram', {
    successRedirect: '/play',
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/instagram/callback', passport.authenticate('instagram', {
    successRedirect: '/play',
    failureRedirect: '/signin'
  }), users.authCallback);
  // Finish with setting up the userId param
  app.param('userId', users.user);

  // Finish with setting up the userId param
  app.param('userId', users.user);

  app.get('/answers', answers.all);
  app.get('/answers/:answerId', answers.show);

  // Finish with setting up the answerId param
  app.param('answerId', answers.answer);

  // questions
  app.get('/questions', questions.all);
  app.get('/questions/:questionId', questions.show);
  // Finish with setting up the questionId param
  app.param('questionId', questions.question);

  // avatars
  app.get('/avatars', avatars.allJSON);

  // play the game
  app.get('/play', index.play);

  // User profile route
  app.get('/api/profile', authorization.tokenVerification, users.profile);

  app.get('/api/userprofile', authorization.tokenVerification, users.getUser);

  // User donation route
  app.get('/api/donations', authorization.tokenVerification, users.donations);
  
  // Game history route
  app.get('/api/games/history', authorization.tokenVerification, games.history);

  // Game history route
  app.get('/api/leaderboard', authorization.tokenVerification, games.leaderBoard);
  // index route
  app.get('/', index.render);

  // Game Route
  app.post('/api/games/:id/start', authorization.tokenVerification, games.saveGameResults);

  // Friends routes
  app.get('/api/users/friends', authorization.tokenVerification, users.friends);
  app.put('/api/users/friends/send', authorization.tokenVerification, users.sendFriendRequest);
  app.put('/api/users/friends/accept', authorization.tokenVerification, users.acceptFriendRequest);
  app.put('/api/users/friends/reject', authorization.tokenVerification, users.rejectFriendRequest);
  app.delete('/api/users/friends', authorization.tokenVerification, users.deleteFriend, users.friends);

  // Notification routes
  app.post('/api/notifications', authorization.tokenVerification, notifications.newNotification);
  app.get('/api/notifications', authorization.tokenVerification, notifications.getNotifications);
  app.delete('/api/notifications', authorization.tokenVerification, notifications.readNotification);
};
