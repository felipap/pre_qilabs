
// required.js
// Python-like decorators for controllers.

var mongoose = require('mongoose');
var	Group = mongoose.model('Group');

module.exports = {
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
						error: true,
						type: "InvalidId",
						args: {
							param:labIdParam,
							value:req.params[labIdParam],
						}
					});
					return;			
				}

				Group.findById(labId,
					function (err, doc) {
						if (err) {
							return next({
								type: "FindErr",
								args: { model:"Group", err:err, id:labId },
							});
						}
						else if (!doc) {
							return next({
								type: "ObsoleteId",
								args: { model:"Group", value:labId }
							});
						} else if (doc.permission === Group.Permissions.Private) {
							return next({ permission:"userCanSee" });
						}
						next();
					}
				);
			}
		},
		userIsMember: function (labIdParam) {
			return function (req, res, next) {
				if (!(labId = req.paramToObjectId(labIdParam))) {
					next({
						error: true,
						type: "InvalidId",
						args: {
							param:labIdParam,
							value:req.params[labIdParam],
						}
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
						error: true,
						type: "InvalidId",
						args: {
							param:labIdParam,
							value:req.params[labIdParam],
						}
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
	}
}