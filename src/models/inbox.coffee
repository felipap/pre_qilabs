
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
async 	 = require 'async'

Types =
	Post: 'Post'

InboxSchema = new mongoose.Schema {
	dateSent:		{ type: Date, index: true }
	recipient:	 	{ type: mongoose.Schema.ObjectId, index: true } # Might as well be a group
	author:			{ type: mongoose.Schema.ObjectId, index: true, ref: 'User' }
	resource:		{ type: mongoose.Schema.ObjectId, ref: 'Post' }
	type: 			{ type: String }
}

InboxSchema.statics.getFromUser = (user, opts, cb) ->
	cb ?= opts
	@
		.find({author: user.id})
		.sort('-dateSent')
		.exec(cb)

InboxSchema.statics.fillInboxes = (opts, cb) ->
	console.assert opts and cb and opts.recipients instanceof Array and opts.resource and
		opts.type, "Get your programming straight."

	if not opts.recipients.length
		return cb(false, [])

	async.mapLimit(opts.recipients, 5, ((rec, done) ->
		inbox = new Inbox {
			resource: opts.resource
			type: opts.type
			author: opts.author
			recipient: rec
		}
		inbox.save(done)
	), cb)

InboxSchema.statics.Types = Types

InboxSchema.pre 'save', (next) ->
	@dateSent ?= new Date()
	next()

module.exports = Inbox = mongoose.model "Inbox", InboxSchema