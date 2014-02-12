
mongoose = require 'mongoose'

Inbox = require './inbox.js'
Follow = require './follow.js'

# Schema
UserSchema = new mongoose.Schema {
	name:			String
	username: 		String
	tags:			Array
	facebookId:		String
	accessToken:	String

	notifiable:		{ type: Boolean, default: true }
	lastUpdate:		{ type: Date, default: Date(0) }
	firstAccess: 	Date
	
	contact: {
		email: 		String
	}
	
	portfolio: {
		fullName: 	''
		birthday: 	Date
		city: 		''
		avatarUrl: 	''
	},

	badges: 		[]
	followingTags: 	[]
}, { id: true } # default


# Virtuals
UserSchema.virtual('avatarUrl').get ->
	'https://graph.facebook.com/'+@facebookId+'/picture'

UserSchema.virtual('url').get ->
	'/p/'+@username

# Methods
UserSchema.methods.getInbox = (opts, cb) ->
	Inbox.getUserInbox(@, opts, cb)

UserSchema.methods.getBoard = (opts, cb) ->
	Inbox.getUserBoard(@, opts, cb)


UserSchema.methods.followsId = (userId, cb) ->
	if not userId
		cb(true)
	Follow.findOne {followee:@.id, follower:userId},
		(err, doc) ->
			cb(err, !!doc)

UserSchema.methods.dofollowId = (userId, cb) ->
	if not userId
		cb(true)
	Follow.findOneAndUpdate {followee:@.id, follower:userId},
		{},
		{upsert: true},
		(err, doc) ->
			console.log("Now following:", err, doc)

UserSchema.methods.unfollowId = (userId, cb) ->
	Follow.findOneAndRemove {followee:@.id, follower:userId},
		{upsert: true},
		(err, doc) ->
			console.log("Now unfollowing:", err, doc)

UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = mongoose.model "User", UserSchema