
# api.coffee

tumblr	= require 'tumblr'
request = require 'request'
_ = require 'underscore'

# Assumes app.js was run (and possibly updated process.env).
	
exports.sendNotification = (user_id, template, callback) ->
	access_token = process.env.facebook_access_token
	url =  "https://graph.facebook.com/#{user_id}/notifications?access_token=#{access_token}&template=#{encodeURIComponent(template)}"
	request.post url,
		(error, response, body) ->
			console.log "Notification request to #{url} response:", body, error
			callback?(error, response, body)

exports.getBlog = (blogurl) ->
	return new tumblr.Tumblr(blogurl, process.env.tumblr_ock)

exports.pushBlogTags = (blog, callback) ->
	blog.posts (err, data) ->
		if err then return callback?(err, [])
		tags = []
		for post in data.posts
			for tag in post.tags
				if tags.indexOf(tag) == -1
					tags.push(tag);
					console.log('pushing found tag: #' + tag)
		callback?(null, tags)

exports.getPostsWithTags = (blog, tags, callback) ->
	blog.posts({ limit: -1 }, (err, data) ->
		if err then return callback?(err)
		_posts = []
		data.posts.forEach (post) ->
			int = _.intersection(post.tags, tags)
			if int[0]
				_posts.push(post)
		callback?(null, _posts)
	)