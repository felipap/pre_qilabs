
# src/controllers/api_lab
# Copyright QILabs.org
# by @f03lipe

###
The controller for /api/labs/* calls.
###

###
GUIDELINES for development:
- Keep controllers sanitized ALWAYS.
- Never pass request parameters or data to schema methods, always validate
  before. Use res.paramToObjectId to get create ids:
  `(req, res) -> return unless userId = res.paramToObjectId('userId'); ...`
- Prefer no not handle creation/modification of documents. Leave those to
  schemas statics and methods.
###

################################################################################
################################################################################

mongoose = require 'mongoose'
_ = require 'underscore'
ObjectId = mongoose.Types.ObjectId

required = require '../lib/required.js'

Resource = mongoose.model 'Resource'
Group = Resource.model 'Group'
User = Resource.model 'User'
Post = Resource.model 'Post'

# Starts at /api/labs 
module.exports = {
	permissions: [required.login],
	post: (req, res) ->
		req.user.createGroup {
				profile: {
					name: req.body.name
				}
			}, (err, doc) ->
				if err
					req.flash('err', err)
					res.redirect('/labs/create') if err
					return
				res.redirect('/labs/'+doc.id)
	children:
		':labId/posts': {
			permissions: [required.labs.selfCanSee('labId')],
			get: (req, res) ->
				return unless labId = req.paramToObjectId('labId')
				Group.findOne {_id: labId},
					req.handleErrResult((group) ->
						opts = { limit:10 }
						if parseInt(req.query.page)
							opts.maxDate = parseInt(req.query.maxDate)
						req.user.getLabPosts opts, group,
							req.handleErrResult((docs, minDate=-1) ->						
								res.endJson {
									data: docs
									minDate: minDate
								}
							)
					)
			post: [required.labs.selfIsMember('labId'), (req, res) ->
				return unless groupId = req.paramToObjectId('labId')
				if not req.body.type in _.values(Post.Types)
					console.log 'typo', req.body.type, 'invalido', _.values(Post.Types)
					return res.endJSON {error:true,type:'InvalidPostType'}

				req.user.createPost {
					groupId: groupId
					type: req.body.type
					content:
						title: req.body.content.title
						body: req.body.content.body
				}, req.handleErrResult((doc) ->
					doc.populate 'author', (err, doc) ->
						res.endJson {error:false, data:doc}
				)
			]
		}
		':labId/addUser/:userId': {
			permissions: [required.labs.selfIsModerator('labId')],
			name: 'ApiLabAddUser'
			post: (req, res) ->
				return unless labId = req.paramToObjectId('labId')
				return unless userId = req.paramToObjectId('userId')
				Group.findOne {_id: labId}, req.handleErrResult((group) ->
					User.findOne {_id: userId}, req.handleErrResult((user) ->
						req.user.addUserToGroup(user, group,
							(err, membership) ->
								# console.log('what?', err, membership)
								res.endJson {
									error: !!err,
									membership: membership
								}
						)
					)
				)
		}
}