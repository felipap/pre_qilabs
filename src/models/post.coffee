
mongoose = require 'mongoose'

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
	"/posts/{id}".replace(/{id}/, @id)

PostSchema.virtual('apiPath').get ->
	"/api/posts/{id}".replace(/{id}/, @id)

PostSchema.post 'remove', (next) ->
	console.log('removing comments after removing this')
	Post.remove { parentPost: @ }, (err, num) ->
		next()

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