
# routes.js
# for meavisa.org, by @f03lipe

passport = require('passport');
pages = require('./pages.js');

requireLogged = (req, res, next) ->
	unless req.user
		return res.redirect('/')
	next()

requireMe = (req, res, next) ->
	# Require user to be me. :D
	if not req.user or req.user.facebookId isnt process.env.facebook_me
		res.locals.message = ['what do you think you\'re doing?']
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
		methods: pages.Pages.index
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
									obj =
										ip: req.ip
										session: req.session
										users: users
										posts: posts
									res.end(JSON.stringify(obj))
						]
				}
			},
			'tags': {
				methods: {
					# Get all tags.
					get: [requireLogged, pages.Tags.get],
					# Update tags with ?checked=[tags,]
					post: [requireLogged, pages.Tags.post],
				},
				children: {
					':tag': {
						methods: {
							# Update tags with {checked:true|false}.
							put: [requireLogged, pages.Tags.put],
						}
					},
					'template': {
						methods: {
							# Serve the template.
							get: [requireLogged, pages.Tags.template],
						}
					}
				}
			},
			'posts': {
				methods: {
					# Get all posts.
					get: [requireLogged, pages.Posts.get],
				
				},
				children: {
					'template': {
						methods: {
							# Serve the template.
							get: [requireLogged, pages.Posts.template],
						}
					}
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