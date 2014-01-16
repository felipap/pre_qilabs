
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
		tumblrId:			Number
		tags:				Array
		urlTemplate:		{ type: String,	default: '/#posts/{id}' }
		tumblrUrl:			String
		tumblrPostType:		String
		date:				Date
		body:	 			String
		title:	 			String
		isHosted: 			Boolean
		}, {
		id: false,
		toObject: { virtuals: true }
		toJSON: { virtuals: true }
	}

# Virtuals
PostSchema.virtual('path').get ->
	@urlTemplate.replace(/{id}/, @tumblrId)

getPostsWithTags = (tags, callback) ->

	# Get tumblr posts.
	blog.posts({ limit: -1 }, (err, data) ->
		if err then return callback?(err)
		posts = []
		data.posts.forEach (post) ->
			int = _.intersection(post.tags, tags)
			if int[0]
				posts.push(post)
		callback?(err, posts);
	)

# Methods
PostSchema.methods = {}

PostSchema.statics.findOrCreate = findOrCreate

####################################################################################################
####################################################################################################

blog_url = 'http://meavisa.tumblr.com'
blog = api.getBlog 'meavisa.tumblr.com'

PostSchema.statics.get = (cb) ->
	@getCached (err, docs) =>
		if err or not docs.length
			@find {}, (err, docs) ->
				cb(err, docs)
		else
			cb(null, docs)

# TODO? optimize dis
PostSchema.statics.getWithTags = (tags, cb) ->
	@get (err, docs) ->
		cb(err) if err
		cb(null, _.filter(docs, (doc) -> _.intersection(doc.tags, tags).length))

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

PostSchema.statics.flushCache = (cb) ->
	mc = memjs.Client.create()
	console.log('Flushing cached posts.')
	@find {}, (err, docs) =>
		throw err if err
		mc.set('posts', JSON.stringify(docs), cb)

PostSchema.statics.fetchAndCache = (cb) ->
	@fetchNew (err, docs) =>
		@flushCache (err2, num) =>
			cb?(err2 or err, num)

PostSchema.statics.fetchNew = (callback) ->
	blog = api.getBlog('meavisa.tumblr.com')
	onGetTPosts = (posts) =>
		onGetDBPosts = (dbposts) =>
			postsNotSaved = 0
			newposts = []
			for post in posts when not _.findWhere(dbposts, {tumblrId:post.id})
				++postsNotSaved
				newposts.push(post)
				console.log("pushing new post \"#{post.title}\"")
				@create(
					{tumblrId:post.id
					tags:post.tags
					tumblrUrl:post.post_url
					tumblrPostType:post.type
					body:post.body
					title:post.title
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
		@find {}, (err, dbposts) =>
			if err then callback?(err)
			onGetDBPosts(dbposts)

	# Get tumblr posts.
	blog.posts { limit: -1 }, (err, data) ->
		if err then callback?(err)
		onGetTPosts(data.posts)

####################################################################################################
####################################################################################################

module.exports = mongoose.model "Post", PostSchema