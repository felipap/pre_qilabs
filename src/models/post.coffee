
mongoose = require 'mongoose'

PostTypes = 
	Comment: 'Comment' 			# Comment
	Answer: 'Answer' 			# Answer
	PlainPost: 'PlainPost'		# Default

PostSchema = new mongoose.Schema {
	author:			{ type: mongoose.Schema.ObjectId, ref: 'User' }
	group:			{ type: mongoose.Schema.ObjectId, ref: 'Group' }
	dateCreated:	Date
	type: 			{ type: String, default: PostTypes.PlainPost }

	parentPost: 	{ type: mongoose.Schema.ObjectId, ref: 'Post', index: 1 }
	points:			Number
	
	data: {
		title:		String
		body:		String
		tags:		Array
	},
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

# Virtuals
PostSchema.virtual('path').get ->
	"/posts/{id}".replace(/{id}/, @id)

PostSchema.virtual('apiPath').get ->
	"/api/posts/{id}".replace(/{id}/, @id)

PostSchema.pre 'save', (next) ->
	console.log 'saving me', @parentPost
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

####################################################################################################
####################################################################################################

module.exports = Post = mongoose.model "Post", PostSchema