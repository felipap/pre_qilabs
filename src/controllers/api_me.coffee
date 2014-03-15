
mongoose = require 'mongoose'
_ = require 'underscore'
ObjectId = mongoose.Types.ObjectId

required = require '../lib/required.js'

Activity = mongoose.model 'Activity'
Inbox = mongoose.model 'Inbox'
Notification = mongoose.model 'Notification'
Subscriber = mongoose.model 'Subscriber'

Resource = mongoose.model 'Resource'

# Users, Posts, Groups and Follow relationships are Resources.
# They can be refered by Activities and Notifications and populated later.
User = Resource.model 'User'
Post = Resource.model 'Post'
Group = Resource.model 'Group'
Follow = Resource.model 'Follow'

module.exports = {
	permissions: [required.login],
	post: (req, res) ->
		if 'off' is req.query.notifiable
			req.user.notifiable = off
			req.user.save()
		else if 'on' in req.query.notifiable
			req.user.notifiable = on
			req.user.save()
		res.end()
	children: {
		'notifications': {
			get: (req, res) ->
				req.user.getNotifications req.handleErrResult((notes) ->
					res.endJson {
						data: notes
						error: false
					}
				)
			children: {
				':id/access':
					get: (req, res) ->
						return unless nId = req.paramToObjectId('id')
						Notification.update { recipient: req.user.id, _id: nId },
							{ accessed: true, seen: true }, { multi:false }, (err) ->
								res.endJson {
									error: !!err
								}
				'seen':
					post: (req, res) ->
						# console.log('ok')
						res.end()
						Notification.update { recipient: req.user.id },
							{ seen:true }, { multi:true }, (err) ->
								res.endJson {
									error: !!err
								}
			}
		}
		'timeline/posts': {
			post: (req, res) ->
				req.user.createPost {
					groupId: null
					content:
						title: 'My conquest!'+Math.floor(Math.random()*100)
						body: req.body.content.body
				}, req.handleErrResult((doc) ->
					doc.populate 'author', (err, doc) ->
						res.endJson {error:false, data:doc}
				)

			get: (req, res) ->
					opts = { limit: 10 }
					if parseInt(req.query.maxDate)
						opts.maxDate = parseInt(req.query.maxDate)
					req.user.getTimeline opts,
						req.handleErrResult((docs, minDate=-1) ->
							res.endJson {
								minDate: minDate
								data: docs
							}
						)
		}
		'leave': {
			name: 'user_quit'
			post: (req, res) -> # Deletes user account.
					req.user.remove (err, data) ->
						if err then throw err
						req.logout()
						res.redirect('/')
		}
		'logout': {
			name: 'logout',
			post: (req, res) ->
					req.logout()
					res.redirect('/')
		}
	}
}