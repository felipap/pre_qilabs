
mongoose = require 'mongoose'

Inbox = require './inbox.js'

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

FollowSchema = new mongoose.Schema {
	start: 				Date
	follower: 			mongoose.Schema.ObjectId
	followee: 			mongoose.Schema.ObjectId
}

# Virtuals
UserSchema.virtual('avatarUrl').get ->
	'https://graph.facebook.com/'+@facebookId+'/picture'

UserSchema.virtual('url').get ->
	'/p/'+@username

# Methods
UserSchema.methods.getInbox = (opts, cb) ->
	Inbox.getUserInbox(@, opts, cb)


UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = mongoose.model "User", UserSchema