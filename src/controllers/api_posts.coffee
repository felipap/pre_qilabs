
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
			get: [required.posts.selfCanSee('id'), (req, res) ->
					return unless postId = req.paramToObjectId('id')
					Post.findOne { _id:postId }, req.handleErrResult((post) ->
						post.stuff req.handleErrResult (stuffedPost) ->
							res.endJson( post: stuffedPost )
					)
				]
			post: (req, res) ->
					return if not postId = req.paramToObjectId('id')
					# For security, handle each option
			delete: (req, res) ->
					return if not postId = req.paramToObjectId('id')
					Post.findOne {_id: postId, author: req.user},
						req.handleErrResult (doc) ->
							doc.remove()
							res.endJson(doc)
			children: {
				'/upvote':
					post: [required.posts.selfCanComment('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId, req.handleErrResult (post) =>
							req.user.upvotePost post, (err, doc) ->
								res.endJson { err: err, data: doc }
					]
				'/unupvote':
					post: [required.posts.selfCanComment('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId, req.handleErrResult (post) =>
							req.user.unupvotePost post, (err, doc) ->
								res.endJson { err: err, data: doc }
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
						data = {
							content: {
								body: req.body.content.body
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
						data = {
							content: {
								body: req.body.content.body
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