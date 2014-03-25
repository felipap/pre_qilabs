
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
						if isNaN(maxDate = parseInt(req.query.maxDate))
							maxDate = Date.now()
						User.findOne {_id:userId}, req.handleErrResult((user) ->
							User.getUserTimeline user, { maxDate: maxDate },
								req.handleErrResult((docs, minDate=-1) ->
									res.endJson {
										minDate: minDate
										data: docs
									}
								)
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