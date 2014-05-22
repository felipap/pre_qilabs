
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'

_ = require 'underscore'

User = Resource.model 'User'
Post = Resource.model 'Post'
Group  = mongoose.model 'Group'

defaultSanitizerOptions = {
	# To be added: 'pre', 'caption', 'hr', 'code', 'strike', 
	allowedTags: ['h1','h2','b','em','strong','a','img','u','ul','li', 'blockquote', 'p', 'br', 'i'], 
	allowedAttributes: {
		'a': ['href'],
		'img': ['src'],
	},
	# selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
	selfClosing: ['img', 'br'],
	# transformTags: {
	# 	'div': 'span',
	# },
	exclusiveFilter: (frame) ->
		return frame.tag in ['a','span'] and not frame.text.trim()
}

sanitizerOptions = {
	'question': _.extend({}, defaultSanitizerOptions, {
		allowedTags: ['b','em','strong','a','u','ul','blockquote','p'],
	}),
	'tip': defaultSanitizerOptions,
	'experience': defaultSanitizerOptions,
}


getValidPostData = (data, req, res) ->
	# Sanitize tags
	if not data.tags or not data.tags instanceof Array
		res.status(400).endJson(error:true, message:'Selecione pelo menos um assunto relacionado a esse post.')
		return null
	tags = (tag for tag in data.tags when tag in _.keys(res.app.locals.getTagMap()))
	if tags.length == 0
		res.status(400).endJson(error:true, message:'Selecione pelo menos um assunto relacionado a esse post.')
		return null

	# Check title
	if not data.data.title or not data.data.title.length
		res.status(400).endJson({
			error:true,
			message:'Erro! Cadê o título da sua '+res.app.locals.postTypes[req.body.type.toLowerCase()].translated+'?',
		})
		return null
	if data.data.title.length < 10
		res.status(400).endJson({
			error:true,
			message:'Hm... Esse título é muito pequeno. Escreva um com no mínimo 10 caracteres, ok?'
		})
		return null
	if data.data.title.length > 100
		res.status(400).endJson({
			error:true,
			message:'Hmm... esse título é muito grande. Escreva um com até 100 caracteres.'
		})
		return null
	title = data.data.title

	# Check and sanitize body
	if not data.data.body
		res.status(400).endJson({error:true, message:'Escreva um corpo para a sua publicação.'})
		return null

	if data.data.body.length > 20*1000
		res.status(400).endJson({error:true, message:'Erro! Você escreveu tudo isso?'})
		return null

	sanitizer = require 'sanitize-html'
	console.log(req.body.type.toLowerCase(), sanitizerOptions[req.body.type.toLowerCase()])
	body = sanitizer(data.data.body, sanitizerOptions[req.body.type.toLowerCase()])

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

		return unless sanitized = getValidPostData(req.body, req, res)
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

						return unless sanitized = getValidPostData(req.body, req, res)

						post.tags = sanitized.tags
						post.data.title = sanitized.title
						post.data.body = sanitized.body
						console.log "first", req.body.data.body,"\n"
						console.log "final", sanitized.body

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

						if req.body.content.body.length > 1000
							return res.status(400).endJson({error:true,message:'Esse comentário é muito grande.'})
						if req.body.content.body.length < 3
							return res.status(400).endJson({error:true,message:'Esse comentário é muito pequeno.'})

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
								body: body
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