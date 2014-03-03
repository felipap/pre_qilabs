
# src/models/notification
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'underscore'
assert = require 'assert'

hookedModel = require './lib/hookedModel'

# Think internationalization!

Types =
	PostComment: 'PostComment'
	PostAnswer: 'PostAnswer'
	PostAnswer: 'PostAnswer'
	NewFollower: 'NewFollower'
	UpvotedAnswer: 'UpvotedAnswer'
	SharedPost: 'SharedPost'

MsgTemplates = 
	PostComment: '<%= agentName %> comentou na sua publicação'
	NewFollower: '<%= agentName %> começou a te seguir'

################################################################################
## Schema ######################################################################

NotificationSchema = new mongoose.Schema {
	agent:		 	{ type:mongoose.Schema.ObjectId, ref:'User', required:true }
	agentName:	 	{ type:String }
	recipient:	 	{ type:mongoose.Schema.ObjectId, ref:'User', required:true, index:1 }
	type:			{ type:String, required:true }
	seen:			{ type:Boolean, default:false }
	url:			{ type:String }
	dateSent:		{ type:Date, index:true }
	
	group:			{ type:mongoose.Schema.ObjectId, ref:'Group', required:false }
	resources:		[{ type: mongoose.Schema.ObjectId }] # used to delete when resources go down
	thumbnailUrl:	{ type:String, required:false}
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

NotificationSchema.virtual('msg').get ->
	if MsgTemplates[@type]
		return _.template(MsgTemplates[@type], @)
	console.warn "No template found for notification of type"+@type
	return "Notificação "+@type

################################################################################
## Middlewares #################################################################

NotificationSchema.pre 'save', (next) ->
	@dateSent ?= new Date()
	next()

################################################################################
## Statics #####################################################################

# User = mongoose.model 'User'

AssertArgs = (args) ->
	return (func) ->
		return func

notifyUser =
	AssertArgs({ismodel:'User'},{ismodel:'User'},{has:['url','type']}) \
		(recpObj, agentObj, data, cb) ->
			User = mongoose.model 'User'

			# Assert arguments.
			assert recpObj instanceof User and agentObj instanceof User,
				"Invalid arguments. recpObj and agentObj must be instances of the User Schema."
			assert data.type,
				"Invalid arguments. data.type and data.url must be provided."
			assert data.type and data.url,
				"Invalid arguments. data.type and data.url must be provided."

			note = new Notification {
				agent: agentObj
				agentName: agentObj.name
				recipient: recpObj
				type: data.type
				url: data.url
				thumbnailUrl: data.thumbnailUrl or agentObj.avatarUrl
			}
			note.save (err, doc) ->
				cb?(err,doc)

NotificationSchema.statics.Trigger = (agentObj, type) ->
	User = mongoose.model 'User'

	switch type
		when Types.PostComment
			return (commentObj, parentPostObj, cb) ->
				cb ?= ->
				if ''+parentPostObj.author is ''+agentObj.id
					return cb(false)
				parentPostAuthorId = parentPostObj.author
				# Find author of parent post and notify him.
				User.findOne {_id: parentPostAuthorId}, (err, parentPostAuthor) ->
					if parentPostAuthor and not err
						notifyUser parentPostAuthor, agentObj, {
							type: Types.PostComment
							url: commentObj.path
						}, cb
					else
						console.warn("err: #{err} or parentPostAuthor (id:#{parentPostAuthorId}) not found")
						cb(true)
		when Types.NewFollower
			return (followerObj, followeeObj, cb) ->
				# assert
				cb ?= ->
				notifyUser followeeObj, followerObj, {
					type: Types.NewFollower
					url: followerObj.profileUrl
				}, cb


NotificationSchema.statics.Types = Types

module.exports = Notification = hookedModel "Notification", NotificationSchema