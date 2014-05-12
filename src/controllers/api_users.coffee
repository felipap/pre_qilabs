
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'
User = Resource.model 'User'
Post = Resource.model 'Post'

module.exports = {
	children: {
		':userId':
			children:
				'/posts':
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
					]
				'/followers':
					get: [required.login,
						(req, res) ->
							return unless userId = req.paramToObjectId('userId')
							User.findOne {_id:userId}, req.handleErrResult((user) ->
								user.getPopulatedFollowers (err, results) ->
									if err
										res.endJson err
									else
										res.endJson { data:results }
							)
					]
				'/following':
					get: [required.login,
						(req, res) ->
							return unless userId = req.paramToObjectId('userId')
							User.findOne {_id:userId}, req.handleErrResult((user) ->
								user.getPopulatedFollowing (err, results) ->
									if err
										res.endJson err
									else
										res.endJson { data:results }
							)
					]
				'/follow':
					post: [required.login,
						(req, res) ->
							return unless userId = req.paramToObjectId('userId')
							User.findOne {_id: userId}, req.handleErrResult((user) ->
								req.user.dofollowUser user, (err, done) ->
									res.endJson {
										error: !!err,
									}
							)
					]
				'/unfollow':
					post: [required.login,
						(req, res) ->
							return unless userId = req.paramToObjectId('userId')
							User.findOne {_id: userId}, (err, user) ->
								req.user.unfollowUser user, (err, done) ->
									res.endJson {
										error: !!err,
									}
					]
	}
}