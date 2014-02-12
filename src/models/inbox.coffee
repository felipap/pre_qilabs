
mongoose = require 'mongoose'

# Use fan-out write for active users, and fan-out read for nonactive
# http://blog.mongodb.org/post/65612078649/schema-design-for-social-inboxes-in-mongodb

InboxSchema = new mongoose.Schema {
	dateSent:		{ type:Date, index:true }
	recipient:	 	{ type:mongoose.Schema.ObjectId, index:true } # Might as well be a group
	author:			{ type:mongoose.Schema.ObjectId, index:true }
	post: 			mongoose.Schema.ObjectId
}

InboxSchema.statics.getUserBoard = (user, opts, cb) ->
	cb ?= opts
	@
		.find({author: user.id})
		.sort('-dateSent')
		.exec(cb)

InboxSchema.statics.getUserInbox = (user, opts, cb) ->
	console.log('finding inbox for user', typeof(user.id), user.id)
	cb ?= opts
	@
		.find({recipient: user.id})
 		.sort('-dateSent')
 		.exec(cb)

InboxSchema.pre 'save', (next) ->
	console.log('saving date:', @dateSent)
	@dateSent ?= new Date()
	next()

module.exports = mongoose.model "Inbox", InboxSchema