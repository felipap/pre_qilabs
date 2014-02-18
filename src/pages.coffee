
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
		# console.log('result:', err, result)
		if err
			console.log('err handled:', err)
			res.status(400).endJson(error:true)
		else if not result
			res.render404(404)
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
						if err then console.log 'err:', err
						res.render 'pages/timeline',
							user_profile: profile
				else
					res.render 'pages/frontpage'	
			post: (req, res) ->
				# Redirect from frame inside Facebook
				res.end('<html><head></head><body><script type="text/javascript">'+
						'window.top.location="http://meavisa.herokuapp.com"</script>'+
						'</body></html>')
		}

	'/feed':
		name: 'feed'
		permissions: [required.login]
		get: (req, res) ->
			# console.log('logged:', req.user.name, req.user.tags)
			req.user.lastUpdate = new Date()
			req.user.save()
			Tag.getAll (err, tags) ->
				res.render 'pages/feed',
					tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))

	'/painel':
		name: 'panel'
		methods: {
			get: [required.login, (req, res) ->
				res.render 'pages/panel', {}
			]
		}

	'/labs':
		permissions: [required.login]
		children: {
			'create':
				methods:
					get: (req, res) ->
						res.render 'pages/lab_create'
			':slug': {
				get: (req, res) ->
					unless req.params.slug
						return res.render404()
					Group.findOne {slug: req.params.slug},
						HandleErrors(res, (group) ->
							group.genGroupProfile (err, groupProfile) -> # groupProfile?
								# console.log(groupProfile)
								res.render 'pages/lab',
									group: groupProfile
						)
			}
		}

	'/p/:username':
		name: 'profile'
		methods: {
			get: (req, res) ->
				unless req.params.username
					return res.render404()
				User.findOne {username: req.params.username},
					HandleErrors(res, (user2) ->
						user2.genProfile (err, profile) ->
							if err or not profile
								req.logMe "err generating profile", err
								return res.render404()
							req.user.doesFollowUser user2, (err, bool) ->
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