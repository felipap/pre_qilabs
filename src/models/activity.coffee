
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
	NewFollower: "NewFollower"

ContentHtmlTemplates = 
	NewFollower: '<strong><a href="<%= actor.path %>"><%= actor && actor.name %></a></strong> começou a seguir <a href="<%= target.path %>"><%= target && target.name %></a>.'

################################################################################
## Schema ######################################################################

# See http://activitystrea.ms/specs/json/1.0/

ActivitySchema = new mongoose.Schema {
	actor:			{ type: ObjectId, ref: 'User', required: true }
	icon: 			{ type: String }
	object: 		{ type: ObjectId, ref: 'Resource' }
	target: 		{ type: ObjectId, ref: 'Resource' }

	verb: 			{ type: String, required: true }

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
	if @verb of ContentHtmlTemplates
		return _.template(ContentHtmlTemplates[@verb], @)
	console.warn "No html template found for activity of verb "+@verb
	return "Notificação "+@verb

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

################################################################################
## Statics #####################################################################

createAndDistributeActivity = (agentObj, data, cb) ->
	assertArgs({$isModel:'User'},
		{$contains:['verb', 'url', 'actor', 'object', 'target']},'$isCb')

	activity = new Activity {
		type: 'Activity'
		verb: data.verb
		url: data.url
		actor: data.actor
		object: data.object
		target: data.target
	}

	activity.save (err, doc) ->
		if err then console.log err
		console.log doc
		agentObj.getFollowersIds (err, followers) ->
			Inbox.fillInboxes([agentObj._id].concat(followers), {
				resource: activity,
			}, cb)

ActivitySchema.statics.Trigger = (agentObj, type) ->
	User = Resource.model 'User'

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
					verb: Types.NewFollower
					agent: opts.follower._id
					target: opts.followee._id
				}, (err, count) ->
					if err then console.log 'trigger err:', err
					createAndDistributeActivity opts.follower, {
						verb: Types.NewFollower
						url: opts.follower.profileUrl
						actor: opts.follower
						object: opts.follow
						target: opts.followee
					}, ->

ActivitySchema.statics.Types = Types

ActivitySchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Activity = Resource.discriminator "Activity", ActivitySchema