
# notify.coffee
# Notifies users of new posts on the tags they follow.
# When called directly, this file notifies the users.

_ 	= require 'underscore'
api = require './api.js'
models = require './models/models.js'

User = models.User
Post = models.Post

onGetPosts = (posts, callback) ->
	Post.find {}, (err, dbposts) ->
		if err then callback?(err)
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
			callback(null, [])


pushNewPosts = (callback) ->
	# Get blog posts.
	blog = api.getBlog 'meavisa.tumblr.com'
	blog.posts { limit: -1 }, ((err, data) ->
		if err then callback?(err)
		onGetPosts(data.posts, callback))

if module is require.main
	# If being executed directly...
	# > load keys
	try require('./env.js') catch e
	# > open database
	mongoose = require 'mongoose'
	mongoUri = process.env.MONGOLAB_URI or process.env.MONGOHQ_URL or 'mongodb://localhost/madb'
	mongoose.connect(mongoUri)
	# ready to go
	pushNewPosts ->
			# Close database at the end.
			# Otherwise, the script won't close.
			mongoose.connection.close()
else
	exports.pushNewPosts = pushNewPosts