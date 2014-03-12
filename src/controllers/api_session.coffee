
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'

User = mongoose.model 'User'
Post = Resource.model 'Post'
Tag  = mongoose.model 'Tag'
Inbox = mongoose.model 'Inbox'
Group = mongoose.model 'Group'
Follow = mongoose.model 'Follow'
Activity = mongoose.model 'Activity'
Subscriber = mongoose.model 'Subscriber'
Notification = mongoose.model 'Notification'

module.exports = {
	permissions: [required.isMe]
	methods: {
		get: (req, res) ->
			# This be ugly but me don't care.
			console.log req.query
			if req.query.user?
				User.find {}, (err, users) ->
					res.endJson { users:users }
			else if req.query.inbox?
				Inbox.find {}
					.populate 'resource'
					.exec (err, inboxs) ->
						res.endJson { err:err, inboxs:inboxs } 
			else if req.query.group?
				Group.find {}, (err, groups) ->
					res.endJson { group:groups } 
			else if req.query.notification?
				Notification.find {}, (err, notifics) ->
					res.endJson { notifics:notifics } 
			else if req.query.membership?
				Group.Membership.find {}, (err, membership) ->
					res.endJson { membership:membership } 
			else if req.query.post?
				Post.find {}, (err, posts) ->
					res.endJson { posts:posts } 
			else if req.query.follow?
				Follow.find {}, (err, follows) ->
					res.endJson { follows:follows } 
			else if req.query.subscriber?
				Subscriber.find {}, (err, subscribers) ->
					res.endJson { subscribers:subscribers }
			else if req.query.note?
					res.endJson { notes:notes }
			else if req.query.session?
				res.endJson { ip: req.ip, session: req.session } 
				Activity.find {}, (err, notes) ->
			else
					User.find {}, (err, users) ->
						Post.find {}, (err, posts) ->
							Inbox.find {}, (err, inboxs) ->
								Subscriber.find {}, (err, subscribers) ->
									Follow.find {}, (err, follows) ->
										Notification.find {}, (err, notifics) ->
											Group.find {}, (err, groups) ->
												Group.Membership.find {}, (err, memberships) ->
													Activity.find {}, (err, notes) ->
														obj =
															ip: req.ip
															group: groups
															inboxs: inboxs
															notifics: notifics
															membership: memberships
															session: req.session
															users: users
															posts: posts
															follows: follows
															notes: notes
															subscribers: subscribers
														res.endJson obj
	}
}