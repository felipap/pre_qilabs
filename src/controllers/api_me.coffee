
mongoose = require 'mongoose'
_ = require 'underscore'
ObjectId = mongoose.Types.ObjectId

required = require '../lib/required.js'

Activity = mongoose.model 'Activity'
Inbox = mongoose.model 'Inbox'
Notification = mongoose.model 'Notification'

Resource = mongoose.model 'Resource'
Post = Resource.model 'Post'

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
			get: (req, res) ->
					if isNaN(maxDate = parseInt(req.query.maxDate))
						maxDate = Date.now()
					req.user.getTimeline { maxDate: maxDate },
						req.handleErrResult((docs, minDate=-1) ->
							res.endJson {
								minDate: minDate
								data: docs
							}
						)

			post: (req, res) ->
				# if not req.body.type in _.values(Post.Types)
				# 	console.log 'typo', req.body.type, 'invalido', _.values(Post.Types)
				# 	return res.endJSON {error:true,type:'InvalidPostType'}
				sanitizer = require 'sanitizer'
				console.log req.body.body
				console.log 'final:', req.body.tags, sanitizer.sanitize(req.body.body)
				
				tags = (tag for tag in req.body.tags when tag in _.pluck(req.app.locals.tags, 'id'))
				console.log(req.body.tags, tags, req.app.locals.tags, _.pluck(req.app.locals.tags, 'id'))
				if not req.body.title
					res.endJson {error:true, name:'empty title'}
				if not req.body.body
					res.endJson {error:true, name:'empty body'}

				req.user.createPost {
					groupId: null
					type: req.body.type
					content:
						title: req.body.title
						body: sanitizer.sanitize(req.body.body)
					tags: tags
				}, req.handleErrResult((doc) ->
					doc.populate 'author', (err, doc) ->
						res.endJson {error:false, data:doc}
				)
		}
		# 'leave': {
		# 	name: 'user_quit'
		# 	post: (req, res) -> # Deletes user account.
		# 		req.user.remove (err, data) ->
		# 			if err then throw err
		# 			req.logout()
		# 			res.redirect('/')
		# }
		'logout': {
			name: 'logout',
			post: (req, res) ->
					req.logout()
					res.redirect('/')
		}
	}
}