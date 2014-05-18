
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'

User = Resource.model 'User'
Post = Resource.model 'Post'
Group  = mongoose.model 'Group'

module.exports = {

	permissions: [required.login],
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
			put: [required.posts.selfOwns('id'), (req, res) ->
					return if not postId = req.paramToObjectId('id')
					# For security, handle each option

					Post.findById postId, req.handleErrResult (post) =>
						if post.type is 'Comment'
							# Disallow edition of comments.
							return res.endJson {error:true, message:''}

						sanitizer = require 'sanitizer'
						console.log req.body.data.body
						console.log 'final:', req.body.tags, sanitizer.sanitize(req.body.data.body)


						post.data.body = sanitizer.sanitize(req.body.data.body)
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