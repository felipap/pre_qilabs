
###
# models/post.coffee
# for meavisa.org, by @f03lipe
#
# Post model.
###

mongoose = require 'mongoose'
crypto = require 'crypto'
memjs = require 'memjs'
_ = require 'underscore'


authTypes = []

api = require('./../api')
findOrCreate = require('./lib/findOrCreate')

# Schema
PostSchema = new mongoose.Schema {
		tumblrId:			{ type: Number, }
		tags:				{ type: Array, }
		urlTemplate:		{ type: String,	default: '/{id}' }
		tumblrUrl:			{ type: String }
		tumblrPostType:		{ type: String }
		date:				{ type: Date }
	}, { id: false }

# Virtuals
PostSchema.virtual('path').get(() ->
	return @urlTemplate.replace(/{id}/, @id);
)

getPostsWithTags = (tags, callback) ->
	api.getPostsWithTags(blog, tags, (err, _posts) ->
			posts = _posts; # Update global;
			callback?(err, _posts);
		)

# Methods
PostSchema.methods = {}

PostSchema.statics.findOrCreate = findOrCreate

####################################################################################################
####################################################################################################

blog_url = 'http://meavisa.tumblr.com'
blog = api.getBlog 'meavisa.tumblr.com'

# Notice this is updating the global variable.
PostSchema.statics.getWithTags = (tags, cb) ->
	api.getPostsWithTags(blog, tags, (err, _posts) ->
			posts = _posts; # Update global;
			cb?(err, _posts);
		)
	# @getCached (err, results) =>
	# 	if err or not results.length
	# 		api.pushBlogTags(blog,
	# 			(err, _tags) =>
	# 				cb(err) if err
	# 				tags = @recursify(_tags)
	# 				cb(null, tags)
	# 		)
	# 	else
	# 		cb(null, results)


PostSchema.statics.getCached = (cb) ->
	mc = memjs.Client.create()
	mc.get 'posts', (err, val, key) ->
		if err # if cache error, query db
			console.warn('Cache error:', err)
			ret = []
		else if val is null
			console.warn('Cache query for posts returned null.')
			ret = []
		else
			ret = JSON.parse(val.toString())
		cb(null, ret)

PostSchema.statics.fetchAndCache = (cb) ->
	mc = memjs.Client.create()
	console.log('Flushing cached posts.')
	api.pushBlogTags(blog,
		(err, posts) =>
			throw err if err
			mc.set('posts', JSON.stringify(@recursify(posts)), cb)
	)


PostSchema.statics.fetchNew = (callback) ->
	blog = api.getBlog('meavisa.tumblr.com')
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

####################################################################################################
####################################################################################################

module.exports = mongoose.model "Post", PostSchema