
# pushPosts.coffee
# Push new posts to database.

_ 	= require 'underscore'
api = require './api.js'
models = require './models/models.js'

User = models.User
Post = models.Post

pushPostsToDB = (blog, callback) ->
	blog.posts (err, data) ->
		if err then callback?(err)
		console.log('done')
		callback('done')


if module is require.main
	# If being executed directly, first open the database and get the blog obj.
	mongoose = require 'mongoose'
	mongoUri = process.env.MONGOLAB_URI or process.env.MONGOHQ_URL or 'mongodb://localhost/madb'
	mongoose.connect(mongoUri)
	blog = api.getBlog "meavisa.tumblr.com"

	pushPostsToDB(blog, (err, data) ->
			# Close database at the end.
			# Otherwise, the script won't close.
			mongoose.connection.close())
else
	exports.pushPosts = pushPostsToDB