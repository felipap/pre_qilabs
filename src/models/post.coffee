
# src/models/post
# Copyright QILabs.org
# by @f03lipe

################################################################################
################################################################################

mongoose = require 'mongoose'

Inbox = mongoose.model 'Inbox'

PostTypes = 
	Comment: 'Comment' 			# Comment
	Answer: 'Answer' 			# Answer
	PlainPost: 'PlainPost'		# Default

PostSchema = new mongoose.Schema {
	author:			{ type: mongoose.Schema.ObjectId, ref: 'User', required: true }
	group:			{ type: mongoose.Schema.ObjectId, ref: 'Group' }
	dateCreated:	{ type: Date }
	type: 			{ type: String, default: PostTypes.PlainPost, required: true }

	parentPost: 	{ type: mongoose.Schema.ObjectId, ref: 'Post', index: 1 }
	points:			{ type: Number, default: 0 }
	
	data: {
		title:		{ type: String, required: false }
		body:		{ type: String, required: true }
		tags:		Array
	},
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

# Virtuals
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

PostSchema.pre 'remove', (next) ->
	console.log 'removing comments after removing this'
	next()
	Post.find { parentPost: @ }, (err, docs) ->
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'save', (next) ->
	@dateCreated ?= new Date
	next()

PostSchema.methods.getComments = (cb) ->
	Post.find { parentPost: @id }
		.populate 'author'
		.exec (err, docs) ->
			console.log('comment docs:', docs)
			cb(err, docs)

PostSchema.statics.PostTypes = PostTypes
PostSchema.statics.findOrCreate = require('./lib/findOrCreate')

################################################################################
################################################################################

module.exports = Post = mongoose.model "Post", PostSchema