
mongoose = require 'mongoose'

# Use fan-out write for active users, and fan-out read for nonactive
# http://blog.mongodb.org/post/65612078649/schema-design-for-social-inboxes-in-mongodb

InboxSchema = new mongoose.Schema {
	dateSent:		{ type:Date, index:true }
	recipient:	 	{ type:mongoose.Schema.ObjectId, index:true } # Might as well be a group
	author:			{ type:mongoose.Schema.ObjectId, index:true }
	post: 			mongoose.Schema.ObjectId
}

InboxSchema.statics.getFromUser = (user, opts, cb) ->
	cb ?= opts
	@
		.find({author: user.id})
		.sort('-dateSent')
		.exec(cb)

InboxSchema.statics.getToUser = (user, opts, cb) ->
	cb ?= opts
	@
		.find({recipient: user.id})
		.sort('-dateSent')
 		.exec(cb)

InboxSchema.pre 'save', (next) ->
	@dateSent ?= new Date()
	next()

module.exports = mongoose.model "Inbox", InboxSchema