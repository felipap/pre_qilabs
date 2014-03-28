
# pages.coffee
# for QILabs.org
# BSD License

mongoose = require 'mongoose'
util = require 'util'

required = require './lib/required'

Resource = mongoose.model 'Resource'

Post 	= Resource.model 'Post'
User 	= Resource.model 'User'
Group 	= Resource.model 'Group'

Subscriber = mongoose.model 'Subscriber'

module.exports = {
	'/':
		name: 'index'
		get: (req, res) ->
			if req.user
				req.user.lastUpdate = new Date()
				req.user.save()
				req.user.genProfile (err, profile) ->
					if err then console.log 'Serving /. err:', err
					# res.endJson profile
					res.render 'pages/main',
						user_profile: profile
			else
				res.render 'pages/frontpage'

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
		permissions: [required.login]
		get: (req, res) ->
			res.render 'pages/panel', {}

	'/labs':
		permissions: [required.login],
		children: {
			'create':
				methods:
					get: (req, res) ->
						res.render 'pages/lab_create'
			':slug': {
				permissions: [required.labs.selfCanSee('slug')],
				get: (req, res) ->
					unless req.params.slug
						return res.render404()
					Group.findOne {slug: req.params.slug},
						req.handleErrResult (group) ->
							group.genGroupProfile req.handleErrResult (groupProfile) ->
								# console.log('groupProfile', groupProfile)
								console.log('group', groupProfile)
								res.render 'pages/lab',
									group: groupProfile
			}
		}

	'/u/:username':
		name: 'profile'
		methods: {
			get: (req, res) ->
				unless req.params.username
					return res.render404()
				User.findOne {username:req.params.username},
					req.handleErrResult (pUser) ->
						pUser.genProfile (err, profile) ->
							if err or not profile
								# req.logMe "err generating profile", err
								return res.render404()
							req.user.doesFollowUser pUser, (err, bool) ->
								res.render 'pages/profile', 
									profile: profile
									follows: bool
		}

	'/p/create':
		methods: {
			get: (req, res) ->
				res.render 'pages/post_create'
		}

	'/posts/:postId':
		name: 'profile'
		# slugs: {post:'postId'}
		# permissions: [required.posts.selfCanSee('post')]
		get: [required.posts.selfCanSee('postId'), (req, res) ->
			return unless postId = req.paramToObjectId('postId')
			Post.findOne { _id:postId }, req.handleErrResult((post) ->
				if post.parentPost
					# Our post is actually a comment/answer, so redirect user to the
					# comment's actual path (which is its parent's).
					console.log 'redirecting', post.path
					return res.redirect(post.path)
				else
					post.stuff req.handleErrResult (stuffedPost) ->
						res.render 'pages/post.html', {
							post: stuffedPost,
						}
				)
			]
		children: {
			'/edit':
				methods:
					get: (req, res) ->
		}

	'/sobre': 	require './controllers/about'
	'/api': 	require './controllers/api'
	'/auth': 	require './controllers/auth'
}