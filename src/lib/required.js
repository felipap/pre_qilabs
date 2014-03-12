
// required.js
// Python-like decorators for controllers.

var mongoose = require('mongoose');
var Resource = mongoose.model('Resource');

var Post = Resource.model('Post');
var	Group = mongoose.model('Group');


var permissions = {


	labs: {

	},

	posts: {

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
				if (!(labId = req.paramToObjectId(labIdParam))) {
					next({
						type: "InvalidId",
						args: { param:labIdParam, value:req.params[labIdParam] },
					});
					return;			
				}

				Group.findById(labId,
					function (err, group) {
						console.log('group', group.permissions)
						if (err) {
							return next({
								type: "FindErr",
								args: { model:"Group", err:err, id:labId },
							});
						}
						else if (!group) {
							return next({
								type: "ObsoleteId",
								args: { model:"Group", id:labId }
							});
						} else if (group.permission === Group.Permissions.Private) {
							Group.Membership.findOne({
									member: req.user,
									group: 	member,
								}, function (err, doc) {
									console.log('four');
									if (!doc) {
										return next({ permission:"userCanSee" });
									}
									next();
								}
							);
						}
						res.locals.lab = group;
						next();
					}
				);
			}
		},
		userIsMember: function (labIdParam) {
			return function (req, res, next) {
				if (!(labId = req.paramToObjectId(labIdParam))) {
					next({
						type: "InvalidId",
						args: { param:labIdParam, value:req.params[labIdParam] },
					});
					return;
				}

				Group.Membership.findOne({
						member: req.user,
						group: labId,
					}, function (err, doc) {
							if (err) {
								return next({
									type: "FindErr",
									args: { model:"Group", err:err, id:labId },
								});
							} else if (!doc) {
								return next({ permission:"userIsMember" });
							}
							next();
						}
				);
			}
		},
		userIsModerator: function (labIdParam) {
			return function (req, res, next) {
				if (!(labId = req.paramToObjectId(labIdParam))) {
					next({
						type: "InvalidId",
						args: { param:labIdParam, value:req.params[labIdParam] }
					});
					return;
				}

				Group.Membership.findOne({
						member: req.user,
						group: labId,
					}, function (err, doc) {
							if (err) {
								return next({
									type: "FindErr",
									args: { model:"Group", err:err, id:labId },
								});
							} else if (!doc) {
								return next({ permission:"userIsModerator" });
							}
							next();
						}
				);
			}
		},
	},
	posts: {
		userCanSee: function (postIdParam) {
			return function (req, res, next) {
				if (!(postId = req.paramToObjectId(postIdParam))) {
					next({
						type: "InvalidId",
						args: { param:postIdParam,value:req.params[postIdParam] }
					});
					return;
				}

				// permissions.posts.userCanSee({id:postId}, req, res, function (err) {
				// 	if (err) return next(_.extend(err,{required:'posts.userCanSee'}));
				// });

				Post.findById(postId, function (err, doc) {
					console.log("I'm here")
					if (err) {
						return next({
							type:"FindErr", args:{ model:"Post", err:err, id:postId },
						});
					} else if (!doc) {
						return next({
							type: "ObsoleteId",
							args: { model:"User", id:postId }
						});
					}
					if (doc.group) {
						Group.findById(doc.group, function (err, group) {
							if (err) {
								return next({
									type:"FindErr", args:{ model:"Post.group", id:group.group, err:err },
								});
							} else if (!group) {
								return next({
									type: "ObsoleteId",
									args: { model:"Post.group", id:group.group }
								});
							}
							if (group.permission === Group.Permissions.Private) {	
								Group.Membership.findOne({
										member: req.user,
										group: group,
									}, function (err, group) {
										if (err) {
											return next({
												type: "FindErr",
												args: { model:"Group", err:err, id:labId },
											});
										} else if (!doc) {
											return next({ permission:"userIsModerator" });
										}
										next();
									}
								);
							} else {
								next();
							}				
						});
					} else {
						next();
					}
				});
			};
		},
		userCanComment: function (postIdParam) {
			return function (req, res, next) {
			};
		},
	}
}