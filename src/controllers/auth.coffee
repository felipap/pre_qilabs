
passport = require 'passport'

# Starts at /auth
module.exports =
	children: 
		'facebook/callback':
			methods:
				get: passport.authenticate('facebook', {
					successRedirect: '/',
					failureRedirect: '/login',
				})

		'/facebook':
			methods:
				get: passport.authenticate('facebook', {
					scope: ['email', 'user_likes']
				})