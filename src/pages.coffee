
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
		get: (req, res, next) ->
			if req.user
				req.user.lastUpdate = new Date()
				res.render 'pages/main',
					user_profile: req.user
				req.user.save()
			else
				res.render 'pages/front'

	'/waitlist':
		permissions: [required.logout]
		post: (req, res) ->
			req.assert('email', 'Email inválido.').notEmpty().isEmail()

			if errors = req.validationErrors()
				return res.endJson({error:true,field:'email',message:'Esse email não é inválido? ;)'})
			Subscriber.findOne {email:req.body.email}, (err, doc) ->
				if err
					return res.endJson({error:true, message:'Estamos com problemas para processar o seu pedido.'})
				if doc
					return res.endJson({error:true, field:'email', message:'Esse email já foi registrado.'})
				s = new Subscriber { name: req.body.name, email: req.body.email }
				s.save (err, t) ->
					if err
						return res.endJson({error:true, message:'Estamos com problemas para processar o seu pedido.'})
					res.endJson({error:false})
	'/feed':
		name: 'feed'
		permissions: [required.login]
		get: (req, res) ->
			req.user.lastUpdate = new Date()
			req.user.save()
			Tag.getAll (err, tags) ->
				res.render 'pages/feed',
					tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
	'/entrar':
		get: (req, res) ->
			res.redirect('/auth/facebook')

	'/painel':
		name: 'panel'
		permissions: [required.login]
		get: (req, res) ->
			res.render 'pages/panel', {}

	'/guias/vestibular':
		name: 'guia'
		permissions: [required.login]
		get: (req, res) ->
			res.render 'guide', {}

	'/tags/vestibular':
		name: 'tag'
		permissions: [required.login]
		get: (req, res) ->
			# unless req.params.username
			# 	return res.render404()
			# User.findOne {username:req.params.username},
			# 	req.handleErrResult (pUser) ->
			req.user.genProfile (err, profile) ->
				req.user.doesFollowUser req.user, (err, bool) ->
					res.render 'pages/tag',
						profile: profile
						follows: bool

	'/u/:username':
		name: 'profile'
		permissions: [required.login]
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

	'/new/experience':
		name: 'newExperience'
		get: (req, res) ->
			res.render 'pages/post_forms/experience'

	'/new/pergunta':
		name: 'newQuestion'
		get: (req, res) ->
			res.render 'pages/post_forms/question'

	'/new/dica':
		name: 'newTip'
		get: (req, res) ->
			res.render 'pages/post_forms/tip'

	'/posts/:postId':
		name: 'profile'
		# slugs: {post:'postId'}
		# permissions: [required.posts.selfCanSee('post')]
		get: (req, res) ->
			res.redirect('/#posts/'+req.params.postId)
		# get: [required.posts.selfCanSee('postId'), (req, res) ->
		# 	return unless postId = req.paramToObjectId('postId')
		# 	Post.findOne { _id:postId }, req.handleErrResult((post) ->
		# 		if post.parentPost
		# 			# Our post is actually a comment/answer, so redirect user to the
		# 			# comment's actual path (which is its parent's).
		# 			console.log 'redirecting', post.path
		# 			return res.redirect(post.path)
		# 		else
		# 			post.stuff req.handleErrResult (stuffedPost) ->
		# 				res.render 'pages/post.html', {
		# 					post: stuffedPost,
		# 				}
		# 		)
		# 	]

		children: {
			'/edit':
				methods:
					get: (req, res) ->
		}

	'/sobre': 	require './controllers/about'
	'/api': 	require './controllers/api'
	'/auth': 	require './controllers/auth'
}