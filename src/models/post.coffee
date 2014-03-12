
# src/models/post
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
assertArgs = require './lib/assertArgs'

ObjectId = mongoose.Schema.ObjectId

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'

Types = 
	Comment: 'Comment'
	Answer: 'Answer'
	PlainPost: 'PlainPost'
	VideoPost: 'VideoPost'
	Notification: 'Notification'
	# QuizPost: 'QuizPost'

################################################################################
## Schema ######################################################################

PostSchema = new mongoose.Schema {
	author:			{ type: ObjectId, ref: 'Resource', required: true, indexed: 1 }
	group:			{ type: ObjectId, ref: 'Group', required: false }
	dateCreated:	{ type: Date, indexed: 1 }
	type: 			{ type: String, required: true }
	parentPost:		{ type: ObjectId, ref: 'Post', required: false }
	
	data: {
		title:		{ type: String, required: false }
		body:		{ type: String, required: true }
		tags:		{ type: Array }
	},
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

PostSchema.virtual('path').get ->
	if @parentPost
		"/posts/"+@parentPost+"#"+@id
	else
		"/posts/{id}".replace(/{id}/, @id)

PostSchema.virtual('apiPath').get ->
	"/api/posts/{id}".replace(/{id}/, @id)

urlify = (text) ->
	urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
	return text.replace urlRegex, (url) ->
	    return "<a href=\"#{url}\">#{url}</a>"

PostSchema.virtual('data.unescapedBody').get ->
	urlify(@data.body)

################################################################################
## Middlewares #################################################################

PostSchema.pre 'remove', (next) ->
	next()
	Post.find { parentPost: @ }, (err, docs) ->
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'remove', (next) ->
	next()
	Notification.find { resources: @ }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of post #{@id}"
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'save', (next) ->
	@dateCreated ?= new Date
	next()

################################################################################
## Methods #####################################################################

PostSchema.methods.getComments = (cb) ->
	Post.find { parentPost: @id }
		.populate 'author'
		.exec (err, docs) ->
			cb(err, docs)

PostSchema.methods.stuff = (cb) ->
	@.populate 'author', (err, doc) ->
		if err
			cb(err)
		else if doc
			doc.fillComments(cb)
		else
			cb(false,null)

PostSchema.methods.fillComments = (cb) ->
	if @type not in ['PlainPost', 'Answer']
		cb(false, @toJSON())

	Post.find {parentPost:@, type:Post.Types.Comment}
	.populate 'author'
	.exec (err, comments) =>
		cb(err, _.extend({}, @toJSON(), { comments:comments }))

################################################################################
## Statics #####################################################################

notifyUser = (recpObj, agentObj, data, cb) ->
	assertArgs({ismodel:'User'},{ismodel:'User'},{contains:['url','type']})
	
	User = Resource.model 'User'

	note = new Post {
		agent: agentObj
		agentName: agentObj.name
		recipient: recpObj
		type: data.type
		url: data.url
		thumbnailUrl: data.thumbnailUrl or agentObj.avatarUrl
	}
	if data.resources then note.resources = data.resources 
	note.save (err, doc) ->
		cb?(err,doc)

PostSchema.statics.Trigger = (agentObj, type) ->
	User = Resource.model 'User'

	switch type
		when Types.NewFollower
			return (followerObj, followeeObj, cb) ->
				# assert
				cb ?= ->
				# Find and delete older notifications from the same follower.
				Post.findOne {
					type:Types.NewFollower,
					agent:followerObj,
					recipient:followeeObj
					}, (err, doc) ->
						if doc #
							doc.remove(()->)
						notifyUser followeeObj, followerObj, {
							type: Types.NewFollower
							url: followerObj.profileUrl
							# resources: []
						}, cb

PostSchema.statics.fillComments = (docs, cb) ->
	assert docs, "Can't fill comments of invalid post(s) document." 
	results = []
	async.forEach _.filter(docs, (i) -> i), (post, done) ->
			Post.find {parentPost: post, type:Post.Types.Comment}
				.populate 'author'
				.exec (err, comments) ->
					if post.toObject
						results.push(_.extend({}, post.toObject(), { comments:comments }))
					else
						results.push(_.extend({}, post, { comments:comments }))
					done()
		, (err) ->
			if err then console.log 'Error in fillinpostcomments', err
			cb(err, results)

PostSchema.statics.Types = Types

PostSchema.plugin(require('./lib/hookedModelPlugin'))

module.exports = Post = Resource.discriminator('Post', PostSchema)