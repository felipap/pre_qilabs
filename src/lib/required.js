
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
		userCanSee: function (labId, req, res, callback) {
			Group.findById(labId, req.handleErrResult(function (group) {
				
				res.locals.lab = group;
				
				if ( 1|| group.permission === Group.Permissions.Public) {
					callback();
				} else {
					Group.Membership.findOne({
							member: req.user,
							group: group,
						}, function (err, doc) {
							console.log('four');
							if (!doc) {
								return callback({ permission:"userCanSee" });
							} else {
								callback();
							}
						}
					);
				}
			}));
		},
		userIsMember: function (labId, req, res, callback) {
			Group.Membership.findOne({ member: req.user, group: labId },
				function (err, doc) {
					if (err) {
						return callback({
							type: "FindErr",
							args: { model:"Group", err:err, id:labId },
						});
					} else if (!doc) {
						return callback({ permission:"labs.userIsMember" });
					}
					callback();
				});
		},
		userIsModerator: function (labId, req, res, callback) {
			Group.Membership.findOne({ member: req.user, group: labId },
				function (err, doc) {
					if (err) {
						return callback({
							type: "FindErr",
							args: { model:"Group", err:err, id:labId },
						});
					} else if (!doc.type === Group.Membership.Moderator) {
						return callback({ permission:"labs.userIsModerator" });
					}
					callback();
				});
		},

	},

	posts: {
		userCanSee: function (postId, req, res, callback) {
			Post.findById(postId, req.handleErrResult(function (post) {
				// A priori, all posts are visible if not within a private group.
				if (!post.group) {
					callback();
				} else {
					permissions.labs.userCanSee(post.group, req, res, function (err) {
						callback( err ? extendErr(err, 'posts.userCanSee') : undefined);
					});
				}
			}));
		},

		userCanComment: function (postId, req, res, callback) {
			Post.findById(postId, req.handleErrResult(function (post) {
				// A priori, all posts are visible if not within a private group.
				if (!post.group) {
					callback();
				} else {
					permissions.labs.userIsMember(post.group, req, res, function (err) {
						callback( err ? extendErr(err, 'posts.userCanComment') : undefined);
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
			next({permission:'isMe'});
		else
			next();
	},
	labs: {
		userCanSee: function (labIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(labIdParam, function (labId) {
					permissions.labs.userCanSee(labId, req, res, function (err) {
						next( err ? extendErr(err, 'labs.userCanSee') : undefined);
					});
				});
			};
		},
		userIsMember: function (labIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(labIdParam, function (labId) {
					permissions.labs.userIsMember(labId, req, res, function (err) {
						next( err ? extendErr(err, 'labs.userIsMember') : undefined);
					});
				});
			}
		},
		userIsModerator: function (labIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(labIdParam, function (labId) {
					permissions.labs.userIsMember(labId, req, res, function (err) {
						next( err ? extendErr(err, 'labs.userIsModerator') : undefined);
					});
				});
			}
		},
	},
	posts: {
		userCanSee: function (postIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(postIdParam, function (postId) {
					permissions.posts.userCanSee(postId, req, res, function (err) {
						next();
					});
				});
			};
		},
		userCanComment: function (postIdParam) {
			return function (req, res, next) {
				req.paramToObjectId(postIdParam, function (postId) {
					permissions.posts.userCanComment(postId, req, res, function (err) {
						next( err ? extendErr(err, 'posts.userCanComment') : undefined);
					});
				});
			};
		},
	}
}