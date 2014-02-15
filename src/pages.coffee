
# pages.coffee
# for qilabs.org

mongoose = require 'mongoose'
required = require './lib/required'

Post 	= mongoose.model 'Post'
Inbox 	= mongoose.model 'Inbox'
Tag 	= mongoose.model 'Tag'
User 	= mongoose.model 'User'
Group 	= mongoose.model 'Group'

Subscriber = mongoose.model 'Subscriber'

HandleErrors = (res, cb) ->
	console.assert typeof cb is 'function'
	return (err, result) ->
		console.log('result:', err, result)
		if err
			console.log('err handled:', err)
			res.status(400).endJson(error:true)
		else if not result
			res.status(404).endJson(error:true, name:404)
		else
			cb(result)


module.exports = {
	'/':
		name: 'index'
		methods: {
			get: (req, res) ->
				if req.user
					req.user.lastUpdate = new Date()
					req.user.save()
					req.user.genProfile (err, profile) ->
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

	'/feed':
		name: 'feed'
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

	'/painel':
		name: 'panel'
		methods: {
			get: [required.login, (req, res) ->
				res.render('pages/panel', {})
			]
		}

	'/labs':
		permissions: [required.login]
		children: {
			'create':
				methods:
					get: (req, res) ->
						res.render 'pages/lab_create'
			':slug':
				methods: {
					get: (req, res) ->
						unless req.params.slug
							return res.render404()

						Group.findOne {slug: req.params.slug},
							HandleErrors(res, (group) ->
								group.genGroupProfile (err, profile) -> # profile?
									console.log(err, profile)
									res.render 'pages/lab',
										group: profile
							)
				}
		}

	'/u/:id':
		name: 'profile'
		methods: {
			get: (req, res) ->
				unless req.params.id
					return res.render404()
				User.findOne {username: username},
					HandleErrors(res, (user) ->
						user.genProfile (err, profile) ->
							if err or not profile
								return res.render404()
							console.log('profile', err, profile)
							req.user.doesFollowId profile.id, (err, bool) ->
								res.render 'pages/profile', 
									profile: profile
									follows: bool
					)
		}

	'/post/:postId':
		name: 'profile'
		methods: {
			get: (req, res) ->
		}
		children: {
			'/edit':
				methods:
					get: (req, res) ->
		}

	'/404':
		name: '404'
		methods: {
			get: (req, res) ->
				res.render404()
		}

	'/sobre': 	require './controllers/about'
	'/api': 	require './controllers/api'
	'/auth': 	require './controllers/auth'
}