
# src/controllers/api
# Copyright QILabs.org
# by @f03lipe

###
The controller for /api/* calls.
###

###
GUIDELINES for development:
- Keep controllers sanitized ALWAYS.
- Never pass request parameters or data to schema methods, always validate
  before. Use res.paramToObjectId to get create ids:
  `(req, res) -> return unless userId = res.paramToObjectId('userId'); ...`
- Prefer no not handle creation/modification of documents. Leave those to
  schemas statics and methods.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
###

mongoose = require 'mongoose'
_ = require 'underscore'
ObjectId = mongoose.Types.ObjectId

required = require '../lib/required.js'

Resource = mongoose.model 'Resource'

User = mongoose.model 'User'
Post = Resource.model 'Post'
Tag  = mongoose.model 'Tag'
Inbox = mongoose.model 'Inbox'
Group = mongoose.model 'Group'
Follow = mongoose.model 'Follow'
Activity = mongoose.model 'Activity'
Subscriber = mongoose.model 'Subscriber'
Notification = mongoose.model 'Notification'

# Starts at '/api'
module.exports = {
	children: {
		'session': 	require './api_session'
		'testers':
			permissions: [required.logout]
			post: (req, res) ->
				req.assert('email', 'Email inválido.').notEmpty().isEmail();

				if errors = req.validationErrors()
					req.flash('warn', 'Parece que esse email que você digitou é inválido. :O &nbsp;')
					res.redirect('/')
				else
					Subscriber.findOrCreate {email:req.body.email}, (err, doc, isNew) ->
						if err
							req.flash('warn', 'Tivemos problemas para processar o seu email. :O &nbsp;')
						else unless isNew
							req.flash('info', 'Ops. Seu email já estava aqui! Adicionamos ele à lista de prioridades. :) &nbsp;')
						else
							req.flash('info', 'Sucesso! Entraremos em contato. \o/ &nbsp;')
						res.redirect('/')
		'labs':	require './api_labs'
		'posts':require './api_posts'
		'users':require './api_users'
		'me':
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
							opts = { limit:10 }
							
							if parseInt(req.query.maxDate)
								opts.maxDate = parseInt(req.query.maxDate)

							req.user.getTimeline opts,
								req.handleErrResult((docs) ->
									if docs.length is opts.limit
										minDate = docs[docs.length-1].dateCreated.valueOf()
									else
										minDate = -1
							
									res.endJson {
										minDate: minDate
										data: docs
										error: false
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
}