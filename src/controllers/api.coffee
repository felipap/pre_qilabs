
# src/controllers/api
# Copyright QILabs.org
# by @f03lipe

###
The controller for /api/* calls.
###

###
GUIDELINES for development:
- Keep controllers sanitized ALWAYS.
- Never pass request parameters or data to schema methods, always validate
  before. Use res.paramToObjectId to get create ids:
  `(req, res) -> return unless userId = res.paramToObjectId('userId'); ...`
- Prefer no not handle creation/modification of documents. Leave those to
  schemas statics and methods.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
###

mongoose = require 'mongoose'
_ = require 'underscore'
ObjectId = mongoose.Types.ObjectId

required = require '../lib/required.js'

User = mongoose.model 'User'
Post = mongoose.model 'Post'
Tag  = mongoose.model 'Tag'
Inbox = mongoose.model 'Inbox'
Group = mongoose.model 'Group'
Follow = mongoose.model 'Follow'
Subscriber = mongoose.model 'Subscriber'
Notification = mongoose.model 'Notification'

HandleErrResult = (res) ->
	(cb) ->
		(err, result) ->
			if err
				res.status(400).endJson(error:true)
			else if not result
				res.status(404).endJson(error:true, name:404)
			else
				cb.apply(cb, [].splice.call(arguments,1))

# Starts at '/api'
module.exports = {
	children: {
		'session':
			permissions: [required.isMe]
			methods: {
				get: (req, res) ->
					# This be ugly but me don't care.
					console.log req.query
					if req.query.user?
						User.find {}, (err, users) ->
							res.endJson { users:users }
					else if req.query.inbox?
						Inbox.find {}, (err, inboxs) ->
							res.endJson { inboxs:inboxs } 
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
					else if req.query.session?
						res.endJson { ip: req.ip, session: req.session } 
					else
							User.find {}, (err, users) ->
								Post.find {}, (err, posts) ->
									Inbox.find {}, (err, inboxs) ->
										Subscriber.find {}, (err, subscribers) ->
											Follow.find {}, (err, follows) ->
												Notification.find {}, (err, notifics) ->
													Group.find {}, (err, groups) ->
														Group.Membership.find {}, (err, membership) ->
															obj =
																ip: req.ip
																group: groups
																inboxs: inboxs
																notifics: notifics
																membership: membership
																session: req.session
																users: users
																posts: posts
																follows: follows
																subscribers: subscribers
															res.endJson obj
			}
		'testers':
			permissions: [required.logout]
			post: (req, res) ->
				req.assert('email', 'Email inválido.').notEmpty().isEmail();

				if errors = req.validationErrors()
					req.flash('warn', 'Parece que esse email que você digitou é inválido. :O &nbsp;')
					res.redirect('/')
				else
					Subscriber.findOrCreate {email:req.body.email}, (err, doc, isNew) ->
						if err
							req.flash('warn', 'Tivemos problemas para processar o seu email. :O &nbsp;')
						else unless isNew
							req.flash('info', 'Ops. Seu email já estava aqui! Adicionamos ele à lista de prioridades. :) &nbsp;')
						else
							req.flash('info', 'Sucesso! Entraremos em contato. \o/ &nbsp;')
						res.redirect('/')
		'labs': require './api_lab'
		'posts':
			permissions: [required.login],
			children: {
				'/:id': {
					get: (req, res) ->
						return if not postId = req.paramToObjectId('id')
						console.log 'oi?'
						Post.findOne {_id: postId}, HandleErrResult(res)(
							(doc) -> # If needed to fill response with comments:
								doc.fillComments (err, object) ->
									res.endJson({
										error: false,
										data: object
									})
						)
					post: (req, res) ->
							return if not postId = req.paramToObjectId('id')
							# For security, handle each option
					delete: (req, res) ->
							return if not postId = req.paramToObjectId('id')
							Post.findOne {_id: postId, author: req.user},
								HandleErrResult(res)((doc) ->
									Inbox.remove { resource: doc }, (err, num) ->
									doc.remove()
									res.endJson doc
								)
					children: {
						'/comments': {
							methods: {
								get: (req, res) ->
									return if not postId = req.paramToObjectId('id')
									Post.findById postId
										.populate 'author'
										.exec HandleErrResult(res)((post) ->
											post.getComments HandleErrResult(res)((comments) ->
												res.endJson {
													data: comments
													error: false
													page: -1 # sending all
												}
											)
										)
								post: 
									(req, res) ->
										return if not postId = req.paramToObjectId('id')
										data = {
											content: {
												body: req.body.content.body
											}
										}
										Post.findById(postId,
											HandleErrResult(res)((parentPost) =>
												req.user.commentToPost(parentPost,
													data,
													HandleErrResult(res)((doc) ->
														doc.populate('author',
															HandleErrResult(res) (doc) ->
																res.endJson(error:false, data:doc)
														)
													)
												)
											)
										)
							}
						},
					}
				},
			},
		'users': 
			children: {
				':userId/posts': {
					methods: {
						get: [required.login,
							(req, res) ->
								return unless userId = req.paramToObjectId('userId') 
								# req.logMe("fetched board of user #{req.params.userId}")
								User.getPostsFromUser userId,
									{limit:3, skip:5*parseInt(req.query.page)},
									HandleErrResult(res)((docs) ->
										res.endJson {
											data: docs 
											error: false
											page: parseInt(req.query.page)
										}
									)
						],
					}
				},
				':userId/follow': {
					methods: {
						post: [required.login,
							(req, res) ->
								return unless userId = req.paramToObjectId('userId')
								User.findOne {_id: userId}, HandleErrResult(res)((user) ->
									req.user.dofollowUser user, (err, done) ->
										res.endJson {
											error: !!err,
										}
								)
						],
					}
				},
				':userId/unfollow': {
					methods: {
						post: [required.login,
							(req, res) ->
								return unless userId = req.paramToObjectId('userId')
								User.findOne {_id: userId}, (err, user) ->
									req.user.unfollowUser user, (err, done) ->
										res.endJson {
											error: !!err,
										}
						],
					}
				},	
			}
		'me':
			permissions: [required.login],
			post: (req, res) ->
				if 'off' is req.query.notifiable
					req.user.notifiable = off
					req.user.save()
				else if 'on' in req.query.notifiable
					req.user.notifiable = on
					req.user.save()
				res.end()
			children: {
				'notifications': {
					get: (req, res) ->
						req.user.getNotifications HandleErrResult(req)((notes) ->
							res.endJson {
								data: notes
								error: false
							}
						)
					children: {
						':id/access':
							get: (req, res) ->
								return unless nId = req.paramToObjectId('id')
								Notification.update { recipient: req.user.id, _id: nId },
									{ accessed: true, seen: true }, { multi:false }, (err) ->
										res.endJson {
											error: !!err
										}
						'seen':
							post: (req, res) ->
								# console.log('ok')
								res.end()
								Notification.update { recipient: req.user.id },
									{ seen:true }, { multi:true }, (err) ->
										res.endJson {
											error: !!err
										}
					}
				}
				'timeline/posts': {
					post: (req, res) ->
						req.user.createPost {
							groupId: null
							content:
								title: 'My conquest!'+Math.floor(Math.random()*100)
								body: req.body.content.body
						}, HandleErrResult(res)((doc) ->
							doc.populate 'author', (err, doc) ->
								res.endJson {error:false, data:doc}
						)

					get: (req, res) ->
							opts = { limit:10 }
							
							if parseInt(req.query.maxDate)
								opts.maxDate = parseInt(req.query.maxDate)

							req.user.getTimeline opts,
								HandleErrResult(res)((docs) ->
									if docs.length is opts.limit
										minDate = docs[docs.length-1].dateCreated.valueOf()
									else
										minDate = -1
							
									res.endJson {
										minDate: minDate
										data: docs
										error: false
									}
								)
				}
				'leave': {
					name: 'user_quit'
					post: (req, res) -> # Deletes user account.
							req.user.remove (err, data) ->
								if err then throw err
								req.logout()
								res.redirect('/')
				}
				'logout': {
					name: 'logout',
					post: (req, res) ->
							req.logout()
							res.redirect('/')
				}
			}
	}
}