
mongoose = require 'mongoose'
ObjectId = mongoose.Types.ObjectId

required = require '../lib/required.js'

User = mongoose.model 'User'
Post = mongoose.model 'Post'
Tag  = mongoose.model 'Tag'
Subscriber  = mongoose.model 'Subscriber'

HandleErrors = (res, cb) ->
	return (err, result) ->
		console.log('result:', err, result)
		if err
			res.status(400).endJson(error:true)
		else if not result
			res.status(404).endJson(error:true, name:404)
		else
			cb(result)

# Starts at '/api'
module.exports = {
	children: {
		'session': {
			methods: {
				get: [required.isMe, 
					(req, res) ->
						User.find {}, (err, users) ->
							Post.find {}, (err, posts) ->
								Subscriber.find {}, (err, subscribers) ->
									Tag.getAll (err, tags) ->
										obj =
											ip: req.ip
											session: req.session
											users: users
											tags: tags
											posts: posts
											subscribers: subscribers
										res.end(JSON.stringify(obj))
					]
			}
		},
		'testers': {
			methods: {
				post: [required.logout,
					(req, res) ->
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
				]
			}
		},
		# 'tags': {
		# 	methods: {
		# 		get: [required.login, (req, res) ->
		# 			# Get all tags.
		# 			res.end(JSON.stringify(Tag.checkFollowed(tags, req.user.tags)))
		# 		],
		# 		# Update tags with ?checked=[tags,]
		# 		post: [required.login, 
		# 			(req, res) ->
		# 				# Update checked tags.
		# 				# Checks for a ?checked=[tags,] parameter.
		# 				# Not sure if this is RESTful (who cares?). Certainly we're supposed to
		# 				# use POST when sending data to /api/posts (and not /api/posts/:post)
		# 				{checked} = req.body
		# 				# throw "ERR" if not Tag.isValid(checked)
		# 				req.user.tags = checked
		# 				req.user.save()
		# 				req.flash('info', 'Tags atualizadas com sucesso!')
		# 				res.end()
		# 		],
		# 	},
		# 	children: {
		# 		':tag': {
		# 			methods: {
		# 				# Update tag with {checked:true|false}.
		# 				put: [required.login,
		# 					(req, res) ->
		# 						# Update tag.
		# 						# All this does is accept a {checked:...} object and update the user
		# 						# model accordingly.
		# 						console.log 'did follow'
		# 						console.log 'didn\'t follow'
		# 						if req.params.tag in req.user.tags
		# 							req.user.tags.splice(req.user.tags.indexOf(req.params.tag), 1)
		# 						else
		# 							req.user.tags.push(req.params.tag)
		# 						req.user.save()
		# 						res.end()
		# 				],
		# 			}
		# 		},
		# 	}
		# },
		
		'posts': {
			methods: {
				post: [required.login,
					(req, res) ->
						req.user.createPost {
							content:
								title: 'My conquest!'+Math.floor(Math.random()*100)
								body: req.body.content.body
						}, (err, doc) ->
							res.end(JSON.stringify({error:false}))
				],
			},
			children: {
				'/:id': {
					methods: {
						get: [required.login,
							(req, res) ->
								try
									postId = new ObjectId.fromString(req.params.id)
								catch e
									return res.status(400).endJson(error:true, name:'InvalidId')
								Post.findById postId,
									(err, doc) ->
										if err
											res.status(400).endJson(error:true)
										else if not doc
											res.status(404).endJson(error:true, name:404)
										else
											res.endJson(doc)
							],
					},
					children: {
						'/comments': {
							methods: {
								get: [required.login,
									(req, res) ->
										try
											postId = new ObjectId.fromString(req.params.id)
										catch e
											return res.status(400).endJson(error:true, name:'InvalidId')
										Post.findById postId, HandleErrors(res, (post) ->
												post.getComments HandleErrors(res, (comments) ->
													res.endJson {
														page: 0
														data: comments
													}
												)
											)
								],
								post: [required.login,
									(req, res) ->
										# req.user.commentToPostWithId({id: req.params.id},
										# 	)
								],
							}
						},
					}
				},
			},
		},
		'users': {
			children: {
				':userId/posts': {
					methods: {
						get: [required.login,
							(req, res) ->
								User.getPostsFromUser req.params.userId,
									{limit:3, skip:5*parseInt(req.query.page)},
									(err, docs) ->
										console.log('Fetched board:', docs)
										res.end(JSON.stringify({
											data: docs, 
											page: 0,
										}))
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
		},
		'me': {
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
										# console.log('Fetched timeline:', docs)
										res.end(JSON.stringify({
											data: docs,
											page: parseInt(req.query.page) || 0,
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
				# 'posts': {
				# 	methods: {
				# 		post: [required.login,
				# 			(req, res) ->
				# 				req.user.createPost {
				# 					content:
				# 						title: 'My conquest!'+Math.floor(Math.random()*100)
				# 						body: req.body.content.body
				# 				}, (err, doc) ->
				# 					res.end(JSON.stringify({error:false}))
				# 		]
				# 	}
				# }
			}
		}
	}
}