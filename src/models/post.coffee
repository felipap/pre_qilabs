
mongoose = require 'mongoose'
_ = require 'underscore'

# Remember to use indexes ...
PostSchema = new mongoose.Schema {
	author:			{ type: mongoose.Schema.ObjectId, ref: 'User' }
	group:			{ type: mongoose.Schema.ObjectId, ref: 'Group' }
	dateCreated:	Date
	
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

PostSchema.statics.findOrCreate = require('./lib/findOrCreate')

####################################################################################################
####################################################################################################

module.exports = mongoose.model "Post", PostSchema