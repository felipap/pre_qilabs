
// config/passport.js
// for meavisa.org, @f03lipe

var passport = require('passport');
var User = require('../models/user.js');

function setUpPassport() {
	passport.use(new (require('passport-facebook').Strategy)({
			clientID: process.env.facebook_app_id,
			clientSecret: process.env.facebook_secret,
			callbackURL: "/auth/facebook/callback"
		},
		function (accessToken, refreshToken, profile, done) {
			// console.log('Connected to profile', profile)
			User.findOne({ facebookId: profile.id }, function (err, user) {
				if (err)
				 	return done(err);
				if (user) { // old user
					user.accessToken = accessToken;
					user.name = profile.displayName;
					user.save();
					done(null, user);
				} else { // new user
					console.log('new user: ', profile.displayName)
					User.create({
							facebookId: profile.id,
							name: profile.displayName,
							tags: tags,
						}, function (err, user) {
							if (err) done(err);
							done(null, user);
						});
				}
			})
		}
	));

	passport.serializeUser(function (user, done) {
		return done(null, user._id);
	});

	passport.deserializeUser(function (id, done) {
		User.findOne({_id: id}, function (err, user) {
			return done(err, user);
		});
	})
}

module.exports = setUpPassport