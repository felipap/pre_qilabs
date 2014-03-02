
# src/models/notification
# Copyright QILabs.org
# by @f03lipe

################################################################################
################################################################################

mongoose = require 'mongoose'
async = require 'async'
_ = require 'underscore'

NotificationSchema = new mongoose.Schema {
	agent:		 	{ type:mongoose.Schema.ObjectId, ref:'User', required:true }
	agentName:	 	{ type:String }
	recipient:	 	{ type:mongoose.Schema.ObjectId, ref:'User', required:true, index:1 }
	type:			{ type:String, required:true }
	seen:			{ type:Boolean, default:false }

	group:			{ type:mongoose.Schema.ObjectId, ref:'Group', required:false }
	url:			{ type:String }
	dateSent:		{ type:Date, index:true }
	
	thumbnailUrl:	{ type:String, required:false}
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

# Think internationalization!

Types =
	PostComment: 'PostComment'
	PostAnswer: 'PostAnswer'
	UpvotedAnswer: 'UpvotedAnswer'
	SharedPost: 'SharedPost'

MsgTemplates = 
	PostComment: '<%= agentName %> comentou na sua publicação'
	PostAnswer: 'PostAnswer'
	UpvotedAnswer: 'UpvotedAnswer'
	SharedPost: 'SharedPost'	

################################################################################
# Virtuals #####################################################################

NotificationSchema.virtual('msg').get ->
	if MsgTemplates[@type]
		return _.template(MsgTemplates[@type], @)
	return "Notificação"

################################################################################
# Mongoose Hooks ###############################################################

NotificationSchema.pre 'save', (next) ->
	@dateSent ?= new Date()
	next()

################################################################################
# Statics ######################################################################

notifyUser = (recpObj, agentObj, data, cb) -> # (sign, data, cb)
	note = new Notification {
		agent: agentObj
		agentName: agentObj.name
		recipient: recpObj
		type: data.type
		url: data.url
	}
	note.save (err, doc) ->
		cb?(err,doc)

NotificationSchema.statics.Trigger = (agentObj, type) ->
	User = mongoose.model 'User'

	switch type
		when Types.PostComment
			return (commentObj, parentPostObj, cb) ->
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
			return () ->


NotificationSchema.statics.Types = Types

module.exports = Notification = mongoose.model "Notification", NotificationSchema