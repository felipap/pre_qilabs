
# src/models/post
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'

hookedModel = require './lib/hookedModel'

Inbox = mongoose.model 'Inbox'
Notification = mongoose.model 'Notification'

Types = 
	Comment: 'Comment' 			
	Answer: 'Answer' 		
	PlainPost: 'PlainPost'	# Default

################################################################################
## Schema ######################################################################

PostSchema = new mongoose.Schema {
	author:			{ type: mongoose.Schema.ObjectId, ref: 'User', required: true }
	group:			{ type: mongoose.Schema.ObjectId, ref: 'Group' }
	dateCreated:	{ type: Date }
	type: 			{ type: String, default: Types.PlainPost, required: true }

	parentPost: 	{ type: mongoose.Schema.ObjectId, ref: 'Post', index: 1 }
	points:			{ type: Number, default: 0 }
	
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
			Post.fillInComments(doc, cb)
		else
			cb(false,null)


################################################################################
## Statics #####################################################################

PostSchema.statics.fillInComments = (docs, cb) ->
	assert docs, "Can't fill comments of invalid post(s) document." 

	if docs instanceof Array
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
	else
		console.log 'second option'
		post = docs
		Post.find {parentPost: post, type:Post.Types.Comment}
		.populate 'author'
		.exec (err, comments) ->
			if post.toObject
				cb(err, _.extend({}, post.toObject(), { comments:comments }))
			else
				cb(err, _.extend({}, post, { comments:comments }))

PostSchema.statics.Types = Types
PostSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = Post = hookedModel "Post", PostSchema