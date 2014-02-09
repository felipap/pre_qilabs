
# pages.coffee
# for meavisa.org

User = require './models/user.js'
Post = require './models/post.js'
Tag  = require './models/tag.js'
Subscriber  = require './models/subscriber.js'

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
					res.render 'pages/timeline', {}
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
				if req.user
					# console.log('logged:', req.user.name, req.user.tags)
					req.user.lastUpdate = new Date()
					req.user.save()
					Tag.getAll (err, tags) ->
						res.render 'pages/feed',
								tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
				else
					res.redirect('/')
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
				res.render('pages/profile', {
					# user: req.user,
					# profile: {
					# 	user: req.user # req.params.user
					# },
				})
		},
		name: 'profile'
	},

	'/sobre': require('./controllers/about'),
	'/api': require('./controllers/api'),
	'/auth': require('./controllers/auth'),
}