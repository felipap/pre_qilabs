
# src/models/note
# Copyright QILabs.org
# by @f03lipe


assert = require 'assert'
_ = require 'underscore'
async = require 'async'
mongoose = require 'mongoose'

ObjectId = mongoose.Schema.ObjectId

assertArgs = require './lib/assertArgs'

Resource = mongoose.model 'Resource'
Inbox = mongoose.model 'Inbox'
Notification = mongoose.model 'Notification'

Types = 
	PlainActivity: "PlainActivity"
	NewFollower: "NewFollower"

ContentHtmlTemplates = 
	PostComment: '<strong><%= agentName %></strong> comentou na sua publicação.'
	NewFollower: '<strong><%= agentName %></strong> começou a te seguir.'

################################################################################
## Schema ######################################################################

# See http://activitystrea.ms/specs/json/1.0/

ActivitySchema = new mongoose.Schema {
	actor:			{ type: ObjectId, ref: 'User', required: true }
	icon: 			{ type: String }
	object: 		{ type: ObjectId, ref: 'Resource' }
	target: 		{ type: ObjectId, ref: 'Resource' }

	verb: 			{ type: String, default: Types.PlainActivity, required: true }

	# group:			{ type: ObjectId, ref: 'Group', indexed: 1, required: false }
	# event: 			{ type: ObjectId, ref: 'Event', required: false }
	# tags:		   [{ type: ObjectId, ref: 'Tag' }]
	
	published:		{ type: Date, default: Date.now }
	updated:		{ type: Date, default: Date.now }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

ActivitySchema.virtual('content').get ->
	if ContentHtmlTemplates[@type]
		return _.template(ContentHtmlTemplates[@type], @)
	console.warn "No html template found for activity of type"+@type
	return "Notificação "+@type

ActivitySchema.virtual('apiPath').get ->
	'/api/activities/'+@id

################################################################################
## Middlewares #################################################################

ActivitySchema.pre 'save', (next) ->
	@published ?= new Date
	@updated ?= new Date
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
	assertArgs({$isModel:'User'},{$contains:['type']},'$isCb')

	activity = new Activity {
		type: data.type
		url: data.url
		actor: data.actor
		object: data.object
		target: data.target
	}

	activity.save (err, doc) ->
		if err then console.log err
		agentObj.getFollowersIds (err, followers) ->
			console.log 'followers', followers
			Inbox.fillInboxes([agentObj].concat(followers), {
				resource: data.resource,
			})

ActivitySchema.statics.Trigger = (agentObj, type) ->
	User = mongoose.model 'User'

	switch type
		when Types.NewFollower
			return (opts, cb) ->
				assertArgs({
					follow:{$isModel:'Follow'},
					followee:{$isModel:'User'},
					follower:{$isModel:'User'}
					}, '$isCb', arguments)
				# Find and delete older notifications with the same follower and followee.
				Activity.remove {
					type: Types.NewFollower
					agent: opts.follower._id
					resources: opts.followee._id
				}, (err, count) ->
					console.log 'err?', err, count
					createAndDistributeActivity opts.follower, {
						type: Types.NewFollower
						url: opts.follower.profileUrl
						actor: opts.follower
						object: opts.follow
						target: opts.followee
					}, cb

ActivitySchema.statics.Types = Types

ActivitySchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Activity = mongoose.model "Activity", ActivitySchema