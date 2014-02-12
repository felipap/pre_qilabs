
# pages.coffee
# for meavisa.org

User = require './models/user.js'
Post = require './models/post.js'
Tag  = require './models/tag.js'
Subscriber  = require './models/subscriber.js'
Inbox = require './models/inbox.js'

tags = []
posts = []

Tag.fetchAndCache()	# Fetch from Tumblr server and cache
Post.fetchAndCache()

required = require './lib/required.js'

module.exports = {
	'/': {
		name: 'index',
		methods: {
			get: (req, res) ->
				if req.user
					req.user.lastUpdate = new Date()
					req.user.save()
					Tag.getAll (err, tags) ->
						# req.user.getInbox (err, docs) ->
						Inbox.find {}, (err, docs) ->
							console.log('oo', arguments)
							res.render 'pages/timeline',
								tags: Tag.checkFollowed(tags, req.user.tags)
								posts: ''+err+docs

				else
					User.find()
						.sort({'_id': 'descending'})
						.limit(10)
						.find((err, data) ->
							res.render 'pages/frontpage',
								latestSignIns: data
							)

			post: (req, res) ->
				# Redirect from frame inside Facebook
				res.end('<html><head></head><body><script type="text/javascript">'+
						'window.top.location="http://meavisa.herokuapp.com"</script>'+
						'</body></html>')
		}
	},

	'/feed': {
		name: 'feed',
		methods: {
			get: [required.login, (req, res) ->
				# console.log('logged:', req.user.name, req.user.tags)
				req.user.lastUpdate = new Date()
				req.user.save()
				Tag.getAll (err, tags) ->
					res.render 'pages/feed',
						tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
			],
			post: (req, res) ->
				# Redirect from frame inside Facebook?
				res.end('<html><head></head><body><script type="text/javascript">'+
						'window.top.location="http://meavisa.herokuapp.com"</script>'+
						'</body></html>')
		}
	},

	'/painel': {
		name: 'panel',
		methods: {
			get: [required.login, (req, res) ->
				res.render('pages/panel', {})
			]
		}
	},

	'/tags/:tag': {
		methods: {
			get: (req, res) ->
		}
	},

	'/p/:user': {
		methods: {
			get: (req, res) ->
				# User.getBoardFromUsername {}
				if not req.params.user
					res.redirect('/404')
				User.findOne {username: req.params.user}, (err, profile) ->
					console.log('profile', err, profile)
					if err or not profile
						res.redirect('/404')
					else
						res.render 'pages/profile', 
							profile: profile
		},
		name: 'profile'
	},
	'/404': {
		name: '404'
		methods: {
			get: (req, res) ->
				res.status(404)		
				if req.accepts('html') # respond with html page
					res.status(404).render('pages/404', { url: req.url, user: req.user })
				else if req.accepts('json') # respond with json
					res.status(404).send({ error: 'Not found' })
					return
		}
	}

	'/sobre': require('./controllers/about'),
	'/api': require('./controllers/api'),
	'/auth': require('./controllers/auth'),
}