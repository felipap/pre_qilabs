
// required.js
// Python-like decorators for controllers.

var mongoose = require('mongoose');
var _ = require('underscore');

var Resource = mongoose.model('Resource');
var Post = Resource.model('Post');
var	Group = Resource.model('Group');

function extendErr (err, label) {
	return _.extend(err,{required:(err.required||[]).concat(label)});
}


var permissions = {


	labs: {
		selfCanSee: function (labId, req, res, callback) {
			var mem = _.findWhere(req.user.memberships,{group:''+labId});
			if (mem) {
				callback();
			} else {
				Group.findById(labId, req.handleErrResult(function (group) {
					
					res.locals.lab = group;
					
					if ( 1|| group.visibility === Group.Permissions.Public) {
						callback();
					} else {
						return callback({ permission:"selfCanSee" });
					}
				}));
			}
		},
		selfIsMember: function (labId, req, res, callback) {
			var mem = _.findWhere(req.user.memberships,{group:''+labId});
			if (mem) {
				callback();
			} else {
				return callback({ permission:"labs.selfIsMember" });
			}
		},
		selfIsModerator: function (labId, req, res, callback) {
			var mem = _.findWhere(req.user.memberships,{group:''+labId});
			if (mem.permission === Group.MembershipTypes.Moderator) {
				callback();
			} else {
				return callback({ permission:"labs.selfIsModerator" });
			}
		},

	},

	posts: {
		selfCanSee: function (postId, req, res, callback) {
			Post.findById(postId, req.handleErrResult(function (post) {
				// A priori, all posts are visible if not within a private group.
				if (!post.group) {
					callback();
				} else {
					permissions.labs.selfCanSee(post.group, req, res, function (err) {
						callback( err ? extendErr(err, 'posts.selfCanSee') : undefined);
					});
				}
			}));
		},

		selfCanComment: function (postId, req, res, callback) {
			Post.findById(postId, req.handleErrResult(function (post) {
				// A priori, all posts are visible if not within a private group.
				if (!post.group) {
					callback();
				} else {
					permissions.labs.selfIsMember(post.group, req, res, function (err) {
						callback( err ? extendErr(err, 'posts.selfCanComment') : undefined);
					});
				}
			}));
		},
	},

};

module.exports = required = {
	logout: function (req, res, next) {
		if (req.user)
			next({permission:'logout'});
		else next();
	},
	login: function (req, res, next) {
		if (req.user)
			next();
		else next({permission:'login'});
	},
	// Require user to be me. :D
	isMe: function (req, res, next) {
		if (!req.user || req.user.facebookId !== process.env.facebook_me)
			next({permission:'isMe', args:[process.env.facebook_me, req.user.facebookId]});
		else
			next();
	},
	labs: {
		selfCanSee: function (labIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(labIdParam, function (labId) {
					permissions.labs.selfCanSee(labId, req, res, function (err) {
						next( err ? extendErr(err, 'labs.selfCanSee') : undefined);
					});
				});
			};
		},
		selfIsMember: function (labIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(labIdParam, function (labId) {
					permissions.labs.selfIsMember(labId, req, res, function (err) {
						next( err ? extendErr(err, 'labs.selfIsMember') : undefined);
					});
				});
			}
		},
		selfIsModerator: function (labIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(labIdParam, function (labId) {
					permissions.labs.selfIsModerator(labId, req, res, function (err) {
						console.log('here too')
						next( err ? extendErr(err, 'labs.selfIsModerator') : undefined);
					});
				});
			}
		},
	},
	posts: {
		selfCanSee: function (postIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(postIdParam, function (postId) {
					permissions.posts.selfCanSee(postId, req, res, function (err) {
						next();
					});
				});
			};
		},
		selfCanComment: function (postIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(postIdParam, function (postId) {
					permissions.posts.selfCanComment(postId, req, res, function (err) {
						next( err ? extendErr(err, 'posts.selfCanComment') : undefined);
					});
				});
			};
		},
	}
}