
# notify.coffee
# Notifies users of new posts on the tags they follow.
# When called directly, this file notifies the users.

_ 	= require 'underscore'
api = require './apis.js'
models = require './models/models.js'

User = models.User

onGetPosts = (posts, callback) ->
	User.find {}, (err, users) ->
		numUsersNotSaved = users.length
		for user in users
			tags = _.union.apply null,
						_.pluck \
							_.filter(posts, (post) ->
								# return new Date(post.date) > new Date(user.lastUpdate);
								return true;
						), 'tags'

			if tags.length
				api.sendNotification user.facebookId, "We have updated on some of the tags you are following: "+tags.join(', ')
			else
				console.log "No updates", tags
			
			user.lastUpdate = new Date()
			user.save (e) ->
				numUsersNotSaved -= 1
				if numUsersNotSaved == 0
					callback?()

notifyUpdates = (callback) ->
	# Get blog posts.
	blog = api.getBlog "meavisa.tumblr.com"
	blog.posts (err, data) ->
		if err then throw err
		onGetPosts(data.posts, callback)

if module is require.main
	# If being executed directly, first open the database.
	mongoose = require 'mongoose'
	mongoUri = process.env.MONGOLAB_URI or process.env.MONGOHQ_URL or 'mongodb://localhost/madb'
	mongoose.connect(mongoUri)
	console.log('> notify.js executed')
	notifyUpdates ->
			# Close database at the end.
			# Otherwise, the script won't close.
			mongoose.connection.close()
else
	exports.notifyNewPosts = notifyUpdates