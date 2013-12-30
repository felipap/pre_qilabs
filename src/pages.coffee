
# pages.coffee
# for meavisa.org, by @f03lipe

_	= require 'underscore'
passport = require('passport')

api = require './api.js'

User = require './models/user.js'
Post = require './models/post.js'
Tag  = require './models/tag.js'

blog_url = 'http://meavisa.tumblr.com'
blog = api.getBlog 'meavisa.tumblr.com'
tags = []
posts = []


Tag.fetchAndCache() 		# Fetch from Tumblr server and cache
Post.fetchAndCache()

requireLogged = (req, res, next) ->
	unless req.user
		return res.redirect('/')
	next()

requireMe = (req, res, next) ->
	# Require user to be me. :D
	if not req.user or req.user.facebookId isnt process.env.facebook_me
		req.flash('warn', 'what do you think you\'re doing?')
		return res.redirect('/')
	next()

staticPage = (template, name) ->
	return {
		name: name
		methods: {
			get: (req, res) -> 
				res.render(template, {
					user: req.user
				})
		}
	}

module.exports = {
	'/': {
		name: 'index',
		methods: {
			get: (req, res) ->
				if req.user
					# console.log('logged:', req.user.name, req.user.tags)
					req.user.lastUpdate = new Date()
					req.user.save()
					Tag.getAll (err, tags) ->
						res.render 'pages/home',
								user: req.user
								tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
				else
					User.find()
						.sort({'_id': 'descending'})
						.limit(10)
						.find((err, data) ->
							res.render 'pages/frontpage',
								latestSignIns: data
							)

			post: (req, res) ->
				# Redirect from frame inside Facebook?
				res.end('<html><head></head><body><script type="text/javascript">'+
						'window.top.location="http://meavisa.herokuapp.com"</script>'+
						'</body></html>')

		}
	},
	'/logout': {
		name: 'logout',
		methods: {
			post: [requireLogged,
				(req, res) ->
					if not req.user then return res.redirect '/'
					req.logout()
					res.redirect('/')
			]
		}
	},
	'/leave': {
		name: 'leave',
		methods: {
			get: (req, res) -> # Deletes user account.
				req.user.remove (err, data) ->
					if err then throw err
					req.logout()
					res.redirect('/')
		}
	},
	'/painel': 	staticPage('pages/panel', 'panel'),
	'/sobre': 	staticPage('pages/about', 'about'),
	'/equipe': 	staticPage('pages/team', 'team'),
	'/participe': 	staticPage('pages/join-team', 'join-team'),

	'/tags/:tag': {
		methods: {
			get: (req, res) ->
		}
	},

	'/api': {
		children: {
			'dropall': {
				methods: {
					get: [requireMe,
						(req, res) ->
							# Require user to be me
							waiting = 3
							User.remove {id:'a'}, (err) ->
								res.write "users removed"
								if not --waiting then res.end(err)
							Post.remove {id:'a'}, (err) ->
								res.write "\nposts removed"
								if not --waiting then res.end(err)
							Tag.remove {id:'a'}, (err) ->
								res.write "\nposts removed"
								if not --waiting then res.end(err)
						]
				}
			},
			'session': {
				methods: {
					get: [requireMe, 
						(req, res) ->
							if not req.user or req.user.facebookId isnt process.env.facebook_me
								return res.redirect '/'
							User.find {}, (err, users) ->
								Post.find {}, (err, posts) ->
									Tag.getAll (err, tags) ->
										obj =
											ip: req.ip
											session: req.session
											users: users
											tags: tags
											posts: posts
										res.end(JSON.stringify(obj))
						]
				}
			},
			'tags': {
				methods: {
					get: [requireLogged, (req, res) ->
						# Get all tags.
						res.end(JSON.stringify(Tag.checkFollowed(tags, req.user.tags)))
					],
					# Update tags with ?checked=[tags,]
					post: [requireLogged, 
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
							# Update tags with {checked:true|false}.
							put: [requireLogged,
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
					# 'template': {
					# 	methods: {
					# 		# Serve the template.
					# 		get: [requireLogged,
					# 			(req, res) ->
					# 				res.set({'Content-Type': 'text/plain'})
					# 				res.sendfile(__dirname+'/views/tmpls/post.html')
					# 		],
					# 	}
					# }
				}
			},
			'posts': {
				methods: {
					# Get all posts.
					get: [requireLogged,
						(req, res) ->
							# Get all posts.
							if req.query.tags
								seltags = req.query.tags.split(',')
							else
								seltags = req.user.tags
							Post.getWithTags seltags, (err, docs) ->
								res.end(JSON.stringify(docs))
					],
				},
				children: {
					':id': {
						methods: {
							get: [requireLogged,
								(req, res) ->
									Post.findOne {tumblrId: req.params.id},
										(err, doc) ->
											res.end(JSON.stringify(doc))									
							]
						}
					},
					# 'template': {
					# 	methods: {
					# 		# Serve the template.
					# 		get: [requireLogged,
					# 			(req, res) ->
					# 				res.set({'Content-Type': 'text/plain'})
					# 				res.sendfile(__dirname+'/views/tmpls/tag.html')
					# 		],
					# 	}
					# }
				}
			}
		}
	},

	'/auth/facebook/callback': {
		methods: {
			get: passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }),
		}
	},

	'/auth/facebook': {
		methods: { get: passport.authenticate('facebook') }
	}
}