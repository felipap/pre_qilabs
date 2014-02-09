
User = require '../models/user.js'
Post = require '../models/post.js'
Tag  = require '../models/tag.js'
Subscriber  = require '../models/subscriber.js'

required = require '../lib/required.js'

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
		'tags': {
			methods: {
				get: [required.login, (req, res) ->
					# Get all tags.
					res.end(JSON.stringify(Tag.checkFollowed(tags, req.user.tags)))
				],
				# Update tags with ?checked=[tags,]
				post: [required.login, 
					(req, res) ->
						# Update checked tags.
						# Checks for a ?checked=[tags,] parameter.
						# Not sure if this is RESTful (who cares?). Certainly we're supposed to
						# use POST when sending data to /api/posts (and not /api/posts/:post)
						{checked} = req.body
						# throw "ERR" if not Tag.isValid(checked)
						req.user.tags = checked
						req.user.save()
						req.flash('info', 'Tags atualizadas com sucesso!')
						res.end()
				],
			},
			children: {
				':tag': {
					methods: {
						# Update tag with {checked:true|false}.
						put: [required.login,
							(req, res) ->
								# Update tag.
								# All this does is accept a {checked:...} object and update the user
								# model accordingly.
								console.log 'did follow'
								console.log 'didn\'t follow'
								if req.params.tag in req.user.tags
									req.user.tags.splice(req.user.tags.indexOf(req.params.tag), 1)
								else
									req.user.tags.push(req.params.tag)
								req.user.save()
								res.end()
						],
					}
				},
			}
		},
		'posts': {
			methods: {
				# Get all posts.
				get: [required.login,
					(req, res) ->
						# Get all posts.
						if req.query.tags
							seltags = req.query.tags.split(',')
						else
							seltags = req.user.tags
						page = parseInt(req.query.page) || 0
						Post.getWithTags seltags, (err, docs) ->
							# Fake pagination
							docs = docs.slice(page*5, (page+1)+5)
							console.log(docs.length)
							res.end(JSON.stringify({
								data: docs,
								page: page,
							}))
				],
			},
			children: {
				':id': {
					methods: {
						get: [required.login,
							(req, res) ->
								Post.findOne {tumblrId: req.params.id},
									(err, doc) ->
										res.end(JSON.stringify(doc))									
						]
					}
				},
			}
		},
		'user': {
			methods: {
				post: [required.login,
					(req, res) ->

						if 'off' is req.query.notifiable
							req.user.notifiable = off
							req.user.save()
						else if 'on' in req.query.notifiable
							req.user.notifiable = on
							req.user.save()

						console.log(req.user.notifiable, req.query.notifiable, typeof req.query.notifiable)
						res.end()
					]
			},
			children: {
				'leave': {
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
								if not req.user then return res.redirect '/'
								req.logout()
								res.redirect('/')
						]
					}
				}
			}
		}
	}
}