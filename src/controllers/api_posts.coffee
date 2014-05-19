
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'

_ = require 'underscore'

User = Resource.model 'User'
Post = Resource.model 'Post'
Group  = mongoose.model 'Group'

module.exports = {

	permissions: [required.login],

	post: (req, res) ->
		sanitizer = require 'sanitizer'
		console.log req.body

		data = req.body
		console.log 'final:', data.tags, sanitizer.sanitize(data.data.body), 'porra'

		tags = (tag for tag in data.tags when tag in _.pluck(req.app.locals.getTags(), 'id'))
		console.log(data.tags, tags, req.app.locals.getTags(), _.pluck(req.app.locals.getTags(), 'id'))
		if not data.data.title
			return res.status(400).endJson {error:true, name:'empty title'}
		if not data.data.body
			return res.status(400).endJson {error:true, name:'empty body'}
		if not data.type.toLowerCase() in ['question','tip','experience']
			return res.status(400).endJson {error:true, name:'wtf type'}
		type = data.type[0].toUpperCase()+data.type.slice(1).toLowerCase()

		req.user.createPost {
			groupId: null
			type: type
			content:
				title: data.data.title
				body: sanitizer.sanitize(data.data.body)
			tags: tags
		}, req.handleErrResult((doc) ->
			doc.populate 'author', (err, doc) ->
				res.endJson {error:false, data:doc}
		)

	children: {
		'/:id': {
			# get: [required.posts.selfCanSee('id'), (req, res) ->
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
					# For security, handle each option

					Post.findById postId, req.handleErrResult (post) =>
						if post.type is 'Comment'
							# Disallow edition of comments.
							return res.endJson {error:true, message:''}

						sanitizer = require 'sanitizer'

						data = req.body

						console.log data.data.body
						console.log 'final:', data.tags, sanitizer.sanitize(data.data.body)

						post.data.body = sanitizer.sanitize(data.data.body)

						post.tags = (tag for tag in data.tags when tag in _.pluck(req.app.locals.getTags(), 'id'))
						post.save req.handleErrResult((me) ->
							post.stuff req.handleErrResult (stuffedPost) ->
								res.endJson stuffedPost
						)
				]

			delete: [required.posts.selfOwns('id'), (req, res) ->
				return if not postId = req.paramToObjectId('id')
				Post.findOne {_id: postId, author: req.user},
					req.handleErrResult (doc) ->
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
						sanitizer = require 'sanitizer'
						console.log req.body.body
						console.log 'final:', req.body.tags, sanitizer.sanitize(req.body.body)
						data = {
							content: {
								body: sanitizer.sanitize(req.body.body)
							}
							type: Post.Types.Answer
						}

						Post.findById postId,
							req.handleErrResult (parentPost) =>
								req.user.postToParentPost parentPost, data,
									req.handleErrResult (doc) =>
										doc.populate('author',
											req.handleErrResult (doc) =>
												res.endJson(error:false, data:doc)
										)
					]

			}
		},
	},
}