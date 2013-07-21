
# apis.coffee

tumblr	= require 'tumblr'
request = require 'request'

# Assumes app.js was run (and possibly updated process.env).
	
exports.sendNotification = (user_id, template, callback) ->
	access_token = process.env.facebook_access_token
	url =  "https://graph.facebook.com/#{user_id}/notifications?access_token=#{access_token}&template=#{encodeURIComponent(template)}"
	request.post url,
		(error, response, body) ->
			console.log "Notification request to #{url} response:", body, error
			callback?(error, response, body)

exports.getBlog = (blogurl) ->
	return blog = new tumblr.Tumblr(blogurl, process.env.tumblr_ock)
