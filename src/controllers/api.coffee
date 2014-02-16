
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

################################################################################
################################################################################

mongoose = require 'mongoose'
_ = require 'underscore'
ObjectId = mongoose.Types.ObjectId

required = require '../lib/required.js'

User = mongoose.model 'User'
Post = mongoose.model 'Post'
Tag  = mongoose.model 'Tag'
Group  = mongoose.model 'Group'
Subscriber = mongoose.model 'Subscriber'

HandleErrors = (res, cb) ->
	console.assert typeof cb is 'function'
	return (err, result) ->
		console.log('result:', err, result)
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
					User.find {}, (err, users) ->
						Post.find {}, (err, posts) ->
							Subscriber.find {}, (err, subscribers) ->
								Group.find {}, (err, groups) ->
									Group.Membership.find {}, (err, membership) ->
										obj =
											ip: req.ip
											group: groups
											membership: membership
											session: req.session
											users: users
											posts: posts
											subscribers: subscribers
										res.end(JSON.stringify(obj))
			}
		'testers':
			permissions: [required.logout]
			post: (req, res) ->
				req.assert('email', 'Email inválido.').notEmpty().isEmail();

				if errors = req.validationErrors()
					console.log('invalid', errors)
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
		'labs':
			permissions: [required.login],
			post: (req, res) ->
				console.log req.body
				req.user.createGroup {
						profile: {
							name: req.body.name
						}
					}, (err, doc) ->
						if err
							req.flash('err', err)
							res.redirect('/labs/create') if err
							return
						res.redirect('/labs/'+doc.id)

			children:
				':id/posts': {
					get: (req, res) ->
						return unless id = req.paramToObjectId('id')
						Group.findOne {_id: id}, HandleErrors(res, (group) ->
							req.user.getLabPosts {limit:3, skip:5*parseInt(req.query.page)},
								group,
								HandleErrors(res, (docs) ->
									page = (not docs[0] and -1) or parseInt(req.query.page) or 0
									res.endJson {
										data: 	docs
										error: 	false
										page: 	page
									}
								)
						)
				}
				':id/addUser/:userId': {
					get: (req, res) ->
						return unless id = req.paramToObjectId('id')
						return unless userId = req.paramToObjectId('userId')
						Group.findOne {_id: id}, HandleErrors(res, (group) ->
							User.findOne {_id: userId}, HandleErrors(res, (user) ->
								type = Group.Membership.Types.Member
								req.user.addUserToGroup(user, group, type,
									(err, membership) ->
										console.log('what?', err, membership)
										res.endJson {
											error: !!err,
											membership: membership
										}
								)
							)
						)
				}
		'posts':
			permissions: [required.login],
			post: (req, res) ->
				if req.body.groupId
					try
						groupId = new ObjectId.fromString(req.body.groupId)
					catch e
						return res.endJson(error:true, name:'InvalidId')
				else
					groupId = null
				req.user.createPost {
					groupId: groupId
					content:
						title: 'My conquest!'+Math.floor(Math.random()*100)
						body: req.body.content.body
				}, (err, doc) ->
					doc.populate 'author', (err, doc) ->
						res.end(JSON.stringify({error:false, data:doc}))
			children: {
				'/:id': {
					methods: {
						get: (req, res) ->
								return if not postId = req.paramToObjectId('id')
								Post.findOne {_id: postId}, HandleErrors(res, (doc) ->
									# If needed to fill response with comments:
									Post.find {parentPost: doc}
										.populate 'author'
										.exec HandleErrors(res, (docs) ->
											res.endJson _.extend({}, doc.toObject(), { comments: docs })
										)
								)
						post: (req, res) ->
								return if not postId = req.paramToObjectId('id')
								# For security, handle each option
						delete: (req, res) ->
								return if not postId = req.paramToObjectId('id')
								Post.findOne {_id: postId, author: req.user},
									HandleErrors(res, (doc) ->
										doc.remove()
										res.endJson doc
									)
					},
					children: {
						'/comments': {
							methods: {
								get: (req, res) ->
									return if not postId = req.paramToObjectId('id')
									Post.findById postId
										.populate 'author'
										.exec HandleErrors(res, (post) ->
											post.getComments HandleErrors(res, (comments) ->
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
										console.log req.body.content
										data = {
											content: {
												body: req.body.content.body
											}
										}
										Post.findById(postId,
											HandleErrors(res, (parentPost) =>
												req.user.commentToPost(parentPost,
													data,
													HandleErrors(res, (doc) ->
														doc.populate('author',
															HandleErrors(res, (doc) ->
																res.endJson(error:false, data:doc)
															)
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
								User.getPostsFromUser req.params.userId,
									{limit:3, skip:5*parseInt(req.query.page)},
									HandleErrors(res,
										(docs) ->
											console.log('Fetched board:', docs)
											res.end(JSON.stringify({
												data: docs 
												error: false
												page: parseInt(req.query.page)
											}))
									)
						],
					}
				},
				':userId/follow': {
					methods: {
						post: [required.login,
							(req, res) ->
								req.user.followId req.params.userId, (err, done) ->
									res.end(JSON.stringify({
										error: !!err,
									}))
						],
					}
				},
				':userId/unfollow': {
					methods: {
						post: [required.login,
							(req, res) ->
								req.user.unfollowId req.params.userId, (err, done) ->
									res.end(JSON.stringify({
										error: !!err,
									}))
						],
					}
				},	
			}
		'me': 
			methods: {
				post: [required.login,
					(req, res) ->
						if 'off' is req.query.notifiable
							req.user.notifiable = off
							req.user.save()
						else if 'on' in req.query.notifiable
							req.user.notifiable = on
							req.user.save()
						res.end()
					]
			},
			children: {
				'timeline/posts': {
					methods: {
						get: [required.login,
							(req, res) ->
								req.user.getTimeline {limit:3, skip:5*parseInt(req.query.page)},
									(err, docs) ->
										page = (not docs[0] and -1) or parseInt(req.query.page) or 0
										# console.log('Fetched timeline:', docs)
										res.end(JSON.stringify({
											page: page
											data: docs
											error: false
										}))
						],
					}
				},
				'leave': {
					name: 'user_quit'
					methods: {
						post: [required.login,
							(req, res) -> # Deletes user account.
								req.user.remove (err, data) ->
									if err then throw err
									req.logout()
									res.redirect('/')
							]
					}
				},
				'logout': {
					name: 'logout',
					methods: {
						post: [required.login,
							(req, res) ->
								req.logout()
								res.redirect('/')
						]
					}
				},
			}

	}
}