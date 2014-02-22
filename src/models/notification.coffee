
# src/models/notification
# Copyright QILabs.org
# by @f03lipe

################################################################################
################################################################################

mongoose = require 'mongoose'
async 	 = require 'async'

Types =
	Post: 'Post'

NotificationSchema = new mongoose.Schema {
	dateSent:		{ type: Date, index: true }
	recipient:	 	{ type: mongoose.Schema.ObjectId, ref: 'User', index: 1, required: true }
	# type: 			{ type: String, required: true }
	msg: 			{ type: String }
	url: 			{ type: String }
	seen:			{ type: Boolean, default: false }
}

# Think internationalization!

NotificationSchema.statics.Types = Types

NotificationSchema.pre 'save', (next) ->
	@dateSent ?= new Date()
	next()

module.exports = Notification = mongoose.model "Notification", NotificationSchema