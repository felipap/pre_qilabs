
util = require 'util'
tumblr	= require 'tumblr'
oauth	= require 'oauth'
request = require 'request'

try
	keys = require './env.js'
catch e
	keys = {
		tumblr_ock: process.env.TUMBLR_OCK,
		facebook: {
			app_id: process.env.facebook_app_id,
			secret: process.env.facebook_secret,
			canvas: process.env.facebook_canvas,
		}
	}

exports.sendNotification = (user_id, template, callback) ->
	access_token = '521238787943358|irzJJKJ0-Z8-LiUshAfFazAirac'
	url =  "https://graph.facebook.com/#{user_id}/notifications?access_token=#{access_token}&template=#{encodeURIComponent(template)}"
	request.post url,
		(error, response, body) ->
			console.log "Notification request to #{url} response:", body, error
			if callback then callback(error, response, body)

TUMB_OCK = keys.tumblr_ock

exports.getBlog = (blogurl) ->
	return blog = new tumblr.Tumblr(blogurl, TUMB_OCK)