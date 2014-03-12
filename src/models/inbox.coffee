
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
assertArgs = require './lib/assertArgs'

Types =
	Post: 'Post'

################################################################################
## Schema ######################################################################

InboxSchema = new mongoose.Schema {
	dateSent:	{ type: Date, indexed: 1 }
	recipient:	{ type: mongoose.Schema.ObjectId, ref: 'User', indexed: 1, required: true }
	author:		{ type: mongoose.Schema.ObjectId, ref: 'User', required: true }
	resource:	{ type: mongoose.Schema.ObjectId, ref: 'Resource', required: true }
	type: 		{ type: String, required: true }
}

################################################################################
## Middlewares #################################################################

InboxSchema.pre 'save', (next) ->
	@dateSent ?= new Date()
	next()

################################################################################
## Statics #####################################################################

# InboxSchema.statics.getFromUser = (user, opts, cb) ->
# 	cb ?= opts
# 	@
# 		.find({author: user.id})
# 		.sort('-dateSent')
# 		.exec(cb)

InboxSchema.statics.fillInboxes = (recipients, opts, cb) ->
	# assertArgs($isarray:true, arguments)

	console.assert opts.resource and opts.type, "Get your programming straight."

	if not recipients.length
		return cb(false, [])

	async.mapLimit(recipients, 5, ((rec, done) =>
		inbox = new Inbox {
			resource: opts.resource
			type: opts.type
			author: opts.author
			recipient: rec
		}
		inbox.save(done)
	), cb)

InboxSchema.statics.Types = Types

InboxSchema.plugin(require('./lib/hookedModelPlugin'))

module.exports = Inbox = mongoose.model "Inbox", InboxSchema