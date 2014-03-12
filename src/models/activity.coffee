
# src/models/note
# Copyright QILabs.org
# by @f03lipe

# See http://activitystrea.ms/specs/json/1.0/

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
assertArgs = require './lib/assertArgs'

Resource = mongoose.model 'Resource'
Notification = mongoose.model 'Notification'
ObjectId = mongoose.Schema.ObjectId

Types = 
	PlainActivity: "PlainActivity"
	NewFollower: "NewFollower"

################################################################################
## Schema ######################################################################

ActivitySchema = new mongoose.Schema {
	actor:			{ type: ObjectId, ref: 'User' }

	group:			{ type: ObjectId, ref: 'Group', indexed: 1, required: false }
	# event: 			{ type: ObjectId, ref: 'Event', required: false }
	type: 			{ type: String, default: Types.PlainActivity, required: true }
	published:		{ type: Date }
	updated:		{ type: Date }

	resources:     [{
		label:	{ type: String, required: true }
		type:	{ type: String, required: true }
		object:	{ type: ObjectId, required: true }
	}]

	# tags:		   [{ type: ObjectId, ref: 'Tag' }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

################################################################################
## Middlewares #################################################################

ActivitySchema.pre 'save', (next) ->
	@dateCreated ?= new Date
	next()

################################################################################
## Methods #####################################################################

# ActivitySchema.methods.stuff = (cb) ->
# 	@.populate 'resources', (err, doc) ->
# 		if err
# 			cb(err)
# 		else if doc
# 			doc.fillComments(cb)
# 		else
# 			cb(false,null)

################################################################################
## Statics #####################################################################

# InboxSchema.statics.fillInboxes = (opts, cb) ->
# 	console.assert opts and cb and opts.recipients instanceof Array and opts.resource and
# 		opts.type, "Get your programming straight."

# 	if not opts.recipients.length
# 		return cb(false, [])

# 	async.mapLimit(opts.recipients, 5, ((rec, done) ->
# 		inbox = new Inbox {
# 			resource: opts.resource
# 			type: opts.type
# 			author: opts.author
# 			recipient: rec
# 		}
# 		inbox.save(done)
# 	), cb)

createAndDistributeActivity = (agentObj, data, cb) ->
	assertArgs({$ismodel:'User'},{$contains:['type']},{$iscb:true},arguments)
	
	agentObj.getFollowersIds (err, followers) ->
		console.log 'followers', followers

		async.mapLimit followers, 5, ((rec, done) ->
			note = new Activity {
				agent: agentObj
				recipient: rec
				type: data.type
			}
			if data.resources then note.resources = data.resources
			if data.url then note.url = data.url 
			note.save(done)
		), () ->
			console.log arguments

ActivitySchema.statics.populateResources = (docs, cb) ->
	Post = mongoose.model 'Post'
	User = mongoose.model 'User'

	Activity.find { 'resources.type': 'User' }
		.populate { path: 'resources.object', model: 'User' }
		.exec () ->
	# User.populate docs, { path: 'resources.object', match: { 'resources.typ': 'User' } }, (err, pdoc) ->
			console.log arguments


ActivitySchema.statics.Trigger = (agentObj, type) ->
	User = mongoose.model 'User'

	switch type
		when Types.NewFollower
			return (followerObj, followeeObj, cb) ->
				# assert
				cb ?= ->
				# Find and delete older notifications with the same follower and followee.
				Activity.remove {
					type: Types.NewFollower
					agent: followerObj._id
					resources: followeeObj._id
				}, (err, count) ->
					console.log 'err?', err, count
					createAndDistributeActivity followerObj, {
						type: Types.NewFollower
						url: followerObj.profileUrl
						resources: [{
							label: 'followee',
							type: 'User', 
							object: followeeObj
						}]
					}, cb

ActivitySchema.statics.Types = Types

ActivitySchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Activity = mongoose.model "Activity", ActivitySchema