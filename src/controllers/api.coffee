
# src/controllers/api
# Copyright QILabs.org
# by @f03lipe

###
The controller for /api/* calls.
###

mongoose = require 'mongoose'

Subscriber = mongoose.model 'Subscriber'

# Starts at '/api'
module.exports = {
	children: {
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
		'session': 	require './api_session'
		'labs':		require './api_labs'
		'posts':	require './api_posts'
		'users':	require './api_users'
		'me': 		require './api_me'
	}
}