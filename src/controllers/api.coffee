
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
		'session': 	require './api_session'
		'labs':		require './api_labs'
		'posts':	require './api_posts'
		'users':	require './api_users'
		'me': 		require './api_me'
	}
}