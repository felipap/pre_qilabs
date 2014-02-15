
# src/models/inbox
# Copyright QILabs.org
# by @f03lipe

###
TODO:
✔ Implement fan-out write for active users
- and fan-out read for non-active users.
See http://blog.mongodb.org/post/65612078649
###

################################################################################
################################################################################

mongoose = require 'mongoose'

InboxSchema = new mongoose.Schema {
	dateSent:		{ type: Date, index: true }
	recipient:	 	{ type: mongoose.Schema.ObjectId, index: true } # Might as well be a group
	author:			{ type: mongoose.Schema.ObjectId, index: true, ref: 'User' }
	post:			{ type: mongoose.Schema.ObjectId, ref: 'Post' }
}

InboxSchema.statics.getFromUser = (user, opts, cb) ->
	cb ?= opts
	@
		.find({author: user.id})
		.sort('-dateSent')
		.exec(cb)

# InboxSchema.statics.getToUser = (user, opts, cb) ->
# 	cb ?= opts

InboxSchema.pre 'save', (next) ->
	@dateSent ?= new Date()
	next()

module.exports = mongoose.model "Inbox", InboxSchema