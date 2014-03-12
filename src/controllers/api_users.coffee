
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'
User = mongoose.model 'User'
Post = Resource.model 'Post'

module.exports = {
	children: {
		':userId/posts': {
			methods: {
				get: [required.login,
					(req, res) ->
						return unless userId = req.paramToObjectId('userId') 
						# req.logMe("fetched board of user #{req.params.userId}")
						User.getPostsFromUser userId,
							{limit:3, skip:5*parseInt(req.query.page)},
							res.handleErrResult((docs) ->
								res.endJson {
									data: docs 
									error: false
									page: parseInt(req.query.page)
								}
							)
				],
			}
		},
		':userId/follow': {
			methods: {
				post: [required.login,
					(req, res) ->
						return unless userId = req.paramToObjectId('userId')
						User.findOne {_id: userId}, res.handleErrResult((user) ->
							req.user.dofollowUser user, (err, done) ->
								res.endJson {
									error: !!err,
								}
						)
				],
			}
		},
		':userId/unfollow': {
			methods: {
				post: [required.login,
					(req, res) ->
						return unless userId = req.paramToObjectId('userId')
						User.findOne {_id: userId}, (err, user) ->
							req.user.unfollowUser user, (err, done) ->
								res.endJson {
									error: !!err,
								}
				],
			}
		},	
	}
}