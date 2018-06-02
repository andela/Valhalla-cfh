/*eslint-disable */
/**
 * Module dependencies.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const avatars = require('./avatars').all();

const User = mongoose.model('User');

/**
 * Auth callback
 * @param {Object} req
 * @param {Object} res
 * @return {Object} webpage
 */
exports.authCallback = (req, res) => {
  res.redirect('/chooseavatars');
};

/**
 * Show login form
 * @param {Object} req
 * @param {Object} res
 * @return {Object} webpage
 */
exports.signin = (req, res) => {
  if (!req.user) {
    res.redirect('/#!/signin?error=invalid');
  } else {
    res.redirect('/#!/app');
  }
};

/**
 * Show sign up form
 * @param {Object} req
 * @param {Object} res
 * @return {Object} webpage
 */
exports.signup = (req, res) => {
  if (!req.user) {
    res.redirect('/#!/signup');
  } else {
    res.redirect('/#!/app');
  }
};

/**
 * Logout
 * @param {Object} req
 * @param {Object} res
 * @return {Object} webpage
 */
exports.signout = (req, res) => {
  req.logout();
  res.redirect('/');
};

/**
 * Session
 * @param {Object} req
 * @param {Object} res
 * @return {Object} webpage
 */
exports.session = (req, res) => {
  res.redirect('/');
};

/**
 * Check avatar - Confirm if the user who logged in via passport
 * already has an avatar. If they don't have one, redirect them
 * to our Choose an Avatar page.
 * @param {Object} req
 * @param {Object} res
 * @return {Object} webpage
 */
exports.checkAvatar = (req, res) => {
  if (req.user && req.user._id) {
    User.findOne({
      _id: req.user._id
    })
      .exec((err, user) => {
        if (user.avatar !== undefined) {
          res.redirect('/#!/');
        } else {
          res.redirect('/#!/choose-avatar');
        }
      });
  } else {
    // If user doesn't even exist, redirect to /
    res.redirect('/');
  }
};

/**
 * Create user
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 * @return {Object} webpage
 */
exports.create = (req, res, next) => {
  if (req.body.name && req.body.password && req.body.email) {
    User.findOne({
      email: req.body.email
    }).exec((err, existingUser) => {
      if (!existingUser) {
        const user = new User(req.body);
        // Switch the user's avatar index to an actual avatar url
        user.avatar = avatars[user.avatar];
        user.provider = 'local';
        user.save((err) => {
          if (err) {
            return res.render('/#!/signup?error=unknown', {
              errors: err.errors,
              user
            });
          }
          req.logIn(user, (err) => {
            if (err) return next(err);
            return res.redirect('/#!/');
          });
        });
      } else {
        return res.redirect('/#!/signup?error=existinguser');
      }
    });
  } else {
    return res.redirect('/#!/signup?error=incomplete');
  }
};

/**
 * Assign avatar to user
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 * @return {Object} webpage
 */
exports.avatars = (req, res) => {
  // Update the current user's profile to include the avatar choice they've made
  if (req.user && req.user._id && req.body.avatar !== undefined &&
    /\d/.test(req.body.avatar) && avatars[req.body.avatar]) {
    User.findOne({
      _id: req.user._id
    })
      .exec((err, user) => {
        user.avatar = avatars[req.body.avatar];
        user.save();
      });
  }
  return res.redirect('/#!/app');
};

/**
 * Add donation
 * @param {Object} req
 * @param {Object} res
 * @return {*} void
 */
exports.addDonation = (req, res) => {
  if (req.body && req.user && req.user._id) {
    // Verify that the object contains crowdrise data
    if (req.body.amount && req.body.crowdrise_donation_id && req.body.donor_name) {
      User.findOne({
        _id: req.user._id
      })
        .exec((err, user) => {
        // Confirm that this object hasn't already been entered
          let duplicate = false;
          for (let i = 0; i < user.donations.length; i += 1) {
            if (user.donations[i].crowdrise_donation_id === req.body.crowdrise_donation_id) {
              duplicate = true;
            }
          }
          if (!duplicate) {
            // Validated donation
            user.donations.push(req.body);
            user.premium = 1;
            user.save();
          }
        });
    }
  }
  res.send();
};

/**
 * Show profile
 * @param {Object} req
 * @param {Object} res
 * @return {Object} webpage
 */
exports.show = (req, res) => {
  const user = req.profile;

  res.render('users/show', {
    title: user.name,
    user
  });
};

/**
 * Send User
 * @param {Object} req
 * @param {Object} res
 * @return {Object} user object
 */
exports.me = (req, res) => {
  res.jsonp(req.user || null);
};

/**
 * Find user by id
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 * @param {Object} id
 * @return {*} void
 */
exports.user = (req, res, next, id) => {
  User
    .findOne({
      _id: id
    })
    .exec((err, user) => {
      if (err) return next(err);
      if (!user) return next(new Error(`Failed to load User ${id}`));
      req.profile = user;
      next();
    });
};

/**
* Register a new user
* @param {Object} req
* @param {Object} res
* @return {Object} registration object
*/
exports.registerUser = (req, res) => {
  User.findOne({
    email: req.body.email
  }).exec((err, existingUser) => {
    if (existingUser) {
      return res.status(409).json(['User already exists']);
    }

    const user = new User(req.body);
    user.provider = 'local';
    user.save((err, createdUser) => {
      if (err) {
        return res.status(500).json(['User data not saved']);
      }

      const userData = {
        id: createdUser._id,
        username: createdUser.name,
        email: createdUser.email,
      };

      const token = jwt.sign(userData, 'secret');

      return res.status(200).json({
        message: 'User successfully registered',
        token,
        userData
      });
    });
  });
};

/**
* Method to Login User
* @param {Object} req
* @param {Object} res
* @return {Object} logged in object
*/
exports.login = (req, res) => {
  // Destructure from user
  const { email, password } = req.body;
  // Find email
  User.findOne({ email }).exec((err, user) => {
    if (err) {
      return res.status(500).json({
        error: 'Internal Server Error'
      });
    }
    // If no user found
    if (!user) {
      return res.status(400).json({
        error: 'User Not Found'
      });
    }
    // Compare password from user to database
    if (bcrypt.compareSync(password, user.hashed_password)) {
      const userData = {
        id: user.id
      };
      // Create token
      const token = jwt.sign(userData, 'secretkey', { expiresIn: '5h' });
      return res.status(200).json({
        token,
        message: 'Successfully SignIn',
      });
    }
    return res.status(400).json({
      error: 'Username or Password Incorrect'
    });
  });
};
