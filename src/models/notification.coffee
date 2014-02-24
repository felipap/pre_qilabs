
# src/models/notification
# Copyright QILabs.org
# by @f03lipe

################################################################################
################################################################################

mongoose = require 'mongoose'
async = require 'async'

Types =
	PostComment: 'PostComment'
	PostAnswer: 'PostAnswer'
	UpvotedAnswer: 'UpvotedAnswer'
	SharedPost: 'SharedPost'

NotificationSchema = new mongoose.Schema {
	dateSent:		{ type: Date, index: true }
	agents:		 	{ type: mongoose.Schema.ObjectId, ref: 'User', required: true }
	recipient:	 	{ type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: 1 }
	group: 			{ type: mongoose.Schema.ObjectId, ref: 'Group', required: false}
	type: 			{ type: String, required: true }
	url: 			{ type: String }
	seen:			{ type: Boolean, default: false }
}, {
	toObject: 	{ virtuals : true },
	toJson: 	{ virtuals : true },
}

# Think internationalization!

NotificationSchema.statics.Types = Types

NotificationSchema.virtual('msg').get = () ->
	switch @type
		when PostComment
			return "<agent> comentou a sua publicação".replace(/<agent>/, @agents[0])
		when PostAnswer
			return "<agent> respondeu à sua pergunta no grupo".replace(/<agent>/, @agents[0])
		when UpvotedAnswer
			return 
		when SharedPost
			return 

NotificationSchema.pre 'save', (next) ->
	@dateSent ?= new Date()
	next()

module.exports = Notification = mongoose.model "Notification", NotificationSchema