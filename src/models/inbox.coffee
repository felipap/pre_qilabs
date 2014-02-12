
mongoose = require 'mongoose'

# Use fan-out write for active users, and fan-out read for nonactive
# http://blog.mongodb.org/post/65612078649/schema-design-for-social-inboxes-in-mongodb

InboxSchema = new mongoose.Schema {
	dateSent:		{ type:Date, index:true }
	recipient:	 	{ type:mongoose.Schema.ObjectId, index:true } # Might as well be a group
	author:			mongoose.Schema.ObjectId
	post: 			String
}

InboxSchema.statics.getUserBoard = (user, opts, cb) ->
	cb ?= opts
	@
		.find({author: user.id})
		.sort('-dateSent')
		.exec(cb)

InboxSchema.statics.getUserInbox = (user, opts, cb) ->
	cb ?= opts
	@
		.find({recipient: user.id})
 		.sort('-dateSent')
 		.exec(cb)

InboxSchema.pre 'save', (next) ->
	console.log('saving date:', @dateSent)
	next()

module.exports = mongoose.model "Inbox", InboxSchema