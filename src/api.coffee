
# api.coffee

tumblr	= require 'tumblr'
request = require 'request'
_ = require 'underscore'

User = require './models/user.js'
Post = require './models/post.js'

# Assumes app.js was run (and possibly updated process.env).
	
sendNotification = (user_id, template, callback) ->
	access_token = process.env.facebook_access_token
	url =  "https://graph.facebook.com/#{user_id}/notifications?access_token=#{access_token}&template=#{encodeURIComponent(template)}"
	request.post url,
		(error, response, body) ->
			console.log "Notification request to #{url} response:", body, error
			callback?(error, response, body)

getBlog = (blogurl) ->
	return new tumblr.Tumblr(blogurl, process.env.tumblr_ock)

pushBlogTags = (blog, callback) ->
	blog.posts (err, data) ->
		if err then return callback?(err, [])
		tags = []
		for post in data.posts
			for tag in post.tags
				if tags.indexOf(tag) == -1
					tags.push(tag);
		callback?(null, tags)

getPostsWithTags = (blog, tags, callback) ->
	# Get tumblr posts.
	blog.posts({ limit: -1 }, (err, data) ->
		if err then return callback?(err)
		_posts = []
		data.posts.forEach (post) ->
			int = _.intersection(post.tags, tags)
			if int[0]
				_posts.push(post)
		callback?(null, _posts)
	)

# Notifies users of new posts with the tags that they follow.
notifyNewPosts = (callback) ->
	blog = getBlog('meavisa.tumblr.com')
	onGetTPosts = ((posts) ->
		onGetUsers = ((users) ->
			numUsersNotSaved = users.length
			for user in users # when user.facebookId == process.env.facebook_me
				tags = _.union.apply(null,
							_.pluck \
								_.filter(posts, (post) ->
									return new Date(post.date) > new Date(user.lastUpdate)
							), 'tags')

				if tags.length
					msg = "We have updates on some of the tags you are following: "+tags.slice(0,2).join(', ')+' and more!'
					api.sendNotification user.facebookId, msg
					console.log("To #{user.name}: #{msg}")
				else
					console.log "No updates for #{user.name}."
				user.lastUpdate = new Date()
				user.save (e) ->
					numUsersNotSaved -= 1
					if numUsersNotSaved == 0
						callback?()
		)
		User.find {}, (err, users) ->
			if err then callback?(err)
			onGetUsers(users)
	)

	# Get tumblr posts.
	blog.posts { limit: -1 }, (err, data) ->
		if err then callback?(err)
		onGetTPosts(data.posts)

pushNewPosts = (callback) ->
	blog = getBlog('meavisa.tumblr.com')
	onGetTPosts = ((posts) ->
		onGetDBPosts = ((dbposts) ->
			postsNotSaved = 0
			newposts = []
			for post in posts when not _.findWhere(dbposts, {tumblrId:post.id})
				++postsNotSaved
				newposts.push(post)
				console.log("pushing new post \"#{post.title}\"")
				Post.create(
					{tumblrId:post.id
					tags:post.tags
					tumblrUrl:post.post_url
					tumblrPostType:post.type
					date:post.date},
					((err, data) ->
						if err then callback?(err)
						if --postsNotSaved is 0
							callback?(null, newposts)
					)
				)
			if newposts.length is 0
				console.log('No new posts to push. Quitting.')
				callback(null, [])

		# Get database posts.
		Post.find {}, (err, dbposts) ->
			if err then callback?(err)
			onGetDBPosts(dbposts)
		)
	)

	# Get tumblr posts.
	blog.posts { limit: -1 }, (err, data) ->
		if err then callback?(err)
		onGetTPosts(data.posts)

exports.sendNotification = sendNotification
exports.getBlog = getBlog
exports.pushBlogTags = pushBlogTags
exports.getPostsWithTags = getPostsWithTags
exports.notifyNewPosts = notifyNewPosts