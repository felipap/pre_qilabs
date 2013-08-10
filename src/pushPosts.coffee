
# notify.coffee
# Notifies users of new posts on the tags they follow.
# When called directly, this file notifies the users.

_ 	= require 'underscore'
api = require './api.js'
models = require './models/models.js'

User = models.User
Post = models.Post

onGetPosts = (posts, callback) ->
	User.find {}, (err, users) ->
		numUsersNotSaved = users.length
		for user in users when user.facebookId == process.env.facebook_me
			tags = _.union.apply null,
						_.pluck \
							_.filter(posts, (post) ->
								return true;
								new Date(post.date) > new Date(user.lastUpdate)
						), 'tags'

			if tags.length
				msg = "We have updates on some of the tags you are following: "+tags.slice(0,2).join(', ')+' and more!'
				console.log(msg)
				api.sendNotification user.facebookId, msg
			else
				console.log "No updates for #{user.name}."
			user.lastUpdate = new Date()
			user.save (e) ->
				numUsersNotSaved -= 1
				if numUsersNotSaved == 0
					callback?()

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