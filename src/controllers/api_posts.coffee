
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'

_ = require 'underscore'

User = Resource.model 'User'
Post = Resource.model 'Post'
Group  = mongoose.model 'Group'

defaultSanitizerOptions = {
	allowedTags: ['h1','h2','b','em','strong','a','img','u','ul','blockquote'],
	allowedAttributes: {
		'a': ['href'],
		'img': ['src'],
	},
	transformTags: {
		'div': 'span',
	},
	exclusiveFilter: (frame) ->
		return frame.tag in ['a','span'] and not frame.text.trim()
}

sanitizerOptions = {
	'Question': _.extend(defaultSanitizerOptions, {
		allowedTags: ['b','em','strong','a','u','ul','blockquote'],
	}),
	'Tip': defaultSanitizerOptions,
	'Experience': defaultSanitizerOptions
}


getValidPostData = (data, app) ->
	# Sanitize tags
	if not data.tags or not data.tags instanceof Array
		res.status(400).endJson(error:true, msg:'Selecione pelo menos um assunto relacionado a esse post.')
		return null
	tags = (tag for tag in data.tags when tag in _.keys(app.locals.getTagMap()))
	if tags.length == 0
		res.status(400).endJson(error:true, msg:'Selecione pelo menos um assunto relacionado a esse post.')
		return null

	# Check title
	if not data.data.title or not data.data.title.length
		res.status(400).endJson({
			error:true,
			msg:'Erro! Cadê o título da sua '+app.locals.postTypes[type].translated+'?',
		})
		return null
	if data.data.title.length < 10
		res.status(400).endJson({
			error:true,
			msg:'Hm... Esse título é muito pequeno. Escreva um com no mínimo 10 caracteres, ok?'
		})
		return null
	if data.data.title.length > 100
		res.status(400).endJson({
			error:true,
			msg:'Hmm... esse título é muito grande. Escreva um com até 100 caracteres.'
		})
		return null
	title = data.data.title

	# Check and sanitize body
	if not data.data.body
		res.status(400).endJson({error:true, msg:'Escreva um corpo para a sua publicação.'})
		return null

	if data.data.body.length > 20*1000
		res.status(400).endJson({error:true, msg:'Erro! Você escreveu tudo isso?'})
		return null

	sanitizer = require 'sanitize-html'
	body = sanitizer(data.data.body, sanitizerOptions[type])

	return {
		tags: tags,
		title: title,
		body: body,
	}


module.exports = {

	permissions: [required.login],

	post: (req, res) ->
		data = req.body

		console.log('Checking type')
		# Check and sanitize type
		if not data.type.toLowerCase() in _.keys(req.app.locals.postTypes)
			return res.status(400).endJson(error:true, msg:'Tipo de publicação inválido.')
		type = data.type[0].toUpperCase()+data.type.slice(1).toLowerCase()

		return unless sanitized = getValidPostData(req.body, req.app)
		console.log('Final:', sanitized)

		req.user.createPost {
			type: type,
			tags: sanitized.tags,
			content: {
				title: sanitized.title,
				body: sanitized.body,
			}
		}, req.handleErrResult((doc) ->
			doc.populate 'author', (err, doc) ->
				res.endJson doc
		)

	children: {
		'/:id': {
			get: [(req, res) ->
					return unless postId = req.paramToObjectId('id')
					Post.findOne { _id:postId }, req.handleErrResult((post) ->
						post.stuff req.handleErrResult (stuffedPost) ->
							res.endJson( data: stuffedPost )
					)
				]
			put: [required.posts.selfOwns('id'),
				(req, res) ->
					return if not postId = req.paramToObjectId('id')
					# For security, handle each option separately

					Post.findById postId, req.handleErrResult (post) =>
						if post.type is 'Comment'
							# Disallow edition of comments.
							return res.endJson {error:true, msg:''}

						return unless sanitized = getValidData(req.body, req.app)

						post.tags = sanitized.tags
						post.data.title = sanitized.title
						post.data.body = sanitized.body

						post.save req.handleErrResult((me) ->
							post.stuff req.handleErrResult (stuffedPost) ->
								res.endJson stuffedPost
						)
				]

			delete: [required.posts.selfOwns('id'), (req, res) ->
				return if not postId = req.paramToObjectId('id')
				Post.findOne {_id: postId, author: req.user},
					req.handleErrResult (doc) ->
						if doc.type not in ['Answer','Comment']
							req.user.update {$inc:{'stats.posts':-1}},()->
								console.log(arguments)
						doc.remove()
						res.endJson(doc)
				]

			children: {
				'/delete':
					get: [required.posts.selfOwns('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findOne { _id: postId },
							req.handleErrResult (doc) ->
								doc.remove()
								res.endJson(doc)
						]

				'/upvote':
					# post: [required.posts.selfCanComment('id'),
					post: [required.posts.selfDoesntOwn('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId, req.handleErrResult (post) =>
							req.user.upvotePost post, (err, doc) ->
								res.endJson { error: err, data: doc }
					]
				'/unupvote':
					post: [required.posts.selfDoesntOwn('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId, req.handleErrResult (post) =>
							req.user.unupvotePost post, (err, doc) ->
								res.endJson { error: err, data: doc }
					]
				'/comments':
					get: [required.posts.selfCanSee('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId
							.populate 'author'
							.exec req.handleErrResult (post) ->
								post.getComments req.handleErrResult((comments) =>
									res.endJson {
										data: comments
										error: false
										page: -1 # sending all
									}
								)
					]
					post: [required.posts.selfCanComment('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						htmlEntities = (str) ->
							String(str)
								.replace(/&/g, '&amp;')
								.replace(/</g, '&lt;')
								.replace(/>/g, '&gt;')
								.replace(/"/g, '&quot;')
						data = {
							content: {
								body: htmlEntities(req.body.content.body)
							}
							type: Post.Types.Comment
						}

						Post.findById postId, req.handleErrResult (parentPost) =>
							req.user.postToParentPost parentPost, data,
								req.handleErrResult (doc) =>
									doc.populate('author',
										req.handleErrResult (doc) =>
											res.endJson(error:false, data:doc)
									)
					]
				'/answers':
					post: [required.posts.selfCanComment('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')

						sanitizer = require 'sanitize-html'
						body = sanitizer(req.body.body, {
							allowedTags: ['h1','h2','b','em','strong','a','img','u','ul','blockquote'],
							allowedAttributes: {
								'a': ['href'],
								'img': ['src'],
							},
							transformTags: {
								'div': 'span',
							},
							exclusiveFilter: (frame) ->
								return frame.tag in ['a','span'] and not frame.text.trim()
						})
						data = {
							content: {
								body: sanitizer.sanitize(req.body.body, (uri) -> uri)
							}
							type: Post.Types.Answer
						}
						console.log 'final data:', data

						Post.findById postId,
							req.handleErrResult (parentPost) =>
								req.user.postToParentPost parentPost, data,
									req.handleErrResult (doc) =>
										doc.populate('author',
											req.handleErrResult (doc) =>
												res.endJson doc
										)
					]

			}
		},
	},
}