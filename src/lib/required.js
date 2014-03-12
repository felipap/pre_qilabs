
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
	},
	labs: {
		userCanSee: function (labIdParam) {
			return function (req, res, next) {
				if (!req.user) {
					// return res.status(403).redirect('/');
					return next({error:true, name:"NotLogged"});
				}
				var mongoose = require('mongoose');
				var	Group = mongoose.model('Group');
				// Get labId object.
				try {
					var labId =
						new mongoose.Types.ObjectId.createFromHexString(req.params[labIdParam]);
				} catch (e) {
					return next({error:true, name:"InvalidId", args:{
						param:labIdParam,
						value:req.params[labIdParam],
					}});
				}
				Group.findById(labId,
					function (err, doc) {
						if (err || !doc) {
							return next({error:true, name:"Forbidd2en", msg:doc});
						}
						next();
					});
			}
		},
		userCanAccess: function (labIdParam) {
			return function (req, res, next) {
				if (!req.user) {
					// return res.status(403).redirect('/');
					return next({error:true, name:"NotLogged"});
				}
				var mongoose = require('mongoose');
				var Group = mongoose.model('Group');
				// Get labId object.
				try {
					var labId =
						new mongoose.Types.ObjectId.createFromHexString(req.params[labIdParam]);
				} catch (e) {
					return next({error:true, name:"InvalidId", args:{
						param:labIdParam,
						value:req.params[labIdParam],
					}});
				}
				Group.Membership.findOne({ member:req.user, group:labId },
					function (err, doc) {
						if (err || !doc) {
							return next({error:true, name:"Forbidden"});
						}
						next();
					});
			}
		},
	}
}