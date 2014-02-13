
mongoose = require 'mongoose'

PostSchema = new mongoose.Schema {
	author:			{ type: mongoose.Schema.ObjectId, ref: 'User' }
	group:			{ type: mongoose.Schema.ObjectId, ref: 'Group' }
	dateCreated:	Date
	type: 			String
	
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
	"/post/{id}".replace(/{id}/, @tumblrId)

PostSchema.pre 'save', (next) ->
	@dateCreated ?= new Date
	next()

PostSchema.static.PlainPost = 'PlainPost'

PostSchema.statics.findOrCreate = require('./lib/findOrCreate')

####################################################################################################
####################################################################################################

module.exports = mongoose.model "Post", PostSchema