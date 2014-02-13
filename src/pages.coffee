
# pages.coffee
# for qilabs.org

mongoose = require 'mongoose'

Post = mongoose.model('Post')
Inbox = mongoose.model('Inbox')
Tag  = mongoose.model('Tag')
User = mongoose.model('User')
Subscriber  = mongoose.model('Subscriber')
required = require './lib/required.js'

module.exports = {
	'/': {
		name: 'index',
		methods: {
			get: (req, res) ->
				if req.user
					req.user.lastUpdate = new Date()
					req.user.save()
					User.genProfileFromModel req.user, (err, profile) ->
						res.render 'pages/timeline',
							user_profile: profile
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

	'/p/:user': {
		name: 'profile'
		methods: {
			get: (req, res) ->
				# User.getBoardFromUsername {}
				if not req.params.user
					res.redirect('/404')
				User.genProfileFromUsername req.params.user,
					(err, profile) ->
						if err or not profile
							res.redirect('/404')
						console.log('profile', err, profile)
						req.user.doesFollowId profile.id, (err, bool) ->
							res.render 'pages/profile', 
								profile: profile
								follows: bool
		},
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