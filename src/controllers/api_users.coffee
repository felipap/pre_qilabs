
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Post = Resource.model 'Post'

module.exports = {
	children: {
		':userId/posts': {
			methods: {
				get: [required.login,
					(req, res) ->
						return unless userId = req.paramToObjectId('userId') 
						# req.logMe("fetched board of user #{req.params.userId}")
						opts = { limit: 5 }
						
						if parseInt(req.query.maxDate)
							opts.maxDate = parseInt(req.query.maxDate)

						User.getPostsFromUser userId, opts,
							req.handleErrResult((docs, minDate=-1) ->
								console.log(minDate)
								res.endJson {
									minDate: minDate
									data: docs
									error: false
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
						User.findOne {_id: userId}, req.handleErrResult((user) ->
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