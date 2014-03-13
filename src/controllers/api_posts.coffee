
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'

User = Resource.model 'User'
Post = Resource.model 'Post'
Tag  = mongoose.model 'Tag'

module.exports = {

	permissions: [required.login],
	children: {
		'/:id': {
			get: (req, res) ->
				return if not postId = req.paramToObjectId('id')
				Post.findOne {_id: postId},
					req.handleErrResult((doc) =>
						# If needed to fill response with comments:
						doc.fillComments (err, object) =>
							res.endJson({
								error: false,
								data: object
							})
					)
			post: (req, res) ->
					return if not postId = req.paramToObjectId('id')
					# For security, handle each option
			delete: (req, res) ->
					return if not postId = req.paramToObjectId('id')
					Post.findOne {_id: postId, author: req.user},
						req.handleErrResult (doc) ->
							Inbox.remove { resource:doc }, (err, num) =>
							doc.remove()
							res.endJson(doc)
			children: {
				'/comments':
					methods: {
						get: [required.posts.userCanSee('id'), (req, res) ->
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
						post: [required.posts.userCanComment('id'), (req, res) ->
							return if not postId = req.paramToObjectId('id')
							data = {
								content: {
									body: req.body.content.body
								}
							}
							Post.findById postId,
								req.handleErrResult (parentPost) =>
									req.user.commentToPost parentPost, data,
										req.handleErrResult (doc) =>
											doc.populate('author',
												req.handleErrResult (doc) =>
													res.endJson(error:false, data:doc)
											)
						]
					}
			}
		},
	},
}