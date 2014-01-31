
passport = require 'passport'

# Starts at /auth
module.exports = {
	'facebook/callback': {
		methods: {
			get: passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }),
		}
	},

	'facebook': {
		methods: { get: passport.authenticate('facebook') }
	}
}