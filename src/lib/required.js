
// required.js
// Python-like decorators for controllers.

module.exports = {
	logout: function (req, res, next) {
		if (req.user) {
			if (req.accepts('json')) {
				res.status(403).end();
			} else {
				res.redirect('/');
			}
		} else {
			next();
		}
	},
	login: function (req, res, next) {
		if (req.user) {
			next();
		} else {
			// if (req.accepts('json'))
			// 	res.status(403).end();
			// else
				res.redirect('/');
		}
	},
	isMe: function (req, res, next) {
		// Require user to be me. :D
		if (!req.user || req.user.facebookId !== process.env.facebook_me) {
			// if (req.accepts('html')) 
			// 	// res.status(403).end();
			// else
				res.redirect('/');
		} else {
			next();
		}
	}
}