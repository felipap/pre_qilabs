
mongoose = require 'mongoose'
_ = require 'underscore'

Inbox = require './inbox.js'
Follow = require './follow.js'
Post = require './post.js'

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

UserSchema.virtual('profileUrl').get ->
	'/p/'+@username

# Methods
UserSchema.methods.getInbox = (opts, cb) ->
	Inbox.getUserInbox(@, opts, cb)

UserSchema.methods.getBoard = (opts, cb) ->
	Inbox.getUserBoard(@, opts, cb)

# UserSchema.methods.countFollowers = (cb) ->
# 	Follow.findOne {followee: @id}, (err, doc) ->
# 		cb(err, doc)

UserSchema.methods.getFollowers = (cb) ->
	Follow.find {followee: @id}, (err, docs) ->
		console.log('found follow relationships:',  _.pluck(docs, 'follower'))
		User.find {_id: {$in: _.pluck(docs, 'follower')}}, (err, docs) ->
			console.log('found:', err, docs)
			cb(err, docs)

UserSchema.methods.post = (opts, cb) ->
	# Post.create({m})
	@getFollowers (err, docs) =>
		for follower in docs
			# Inbox.createFromPost
			Inbox.create {
				author: @id,
				recipient: follower.id,
				post: "Fala, #{follower.id}. Como vai? Seguinte: #{opts}",
			}, (err, doc) ->
				console.log('saved, really')
		console.log err, docs

UserSchema.methods.doesFollowId = (userId, cb) ->
	if not userId
		cb(true)
	Follow.findOne {followee:userId, follower:@id},
		(err, doc) ->
			cb(err, !!doc)

UserSchema.statics.genProfileFromUsername = (username, cb) ->
	User.findOne {username: username}, (err, doc) ->
		if err then return cb(err)
		unless doc then return cb(null, doc)
		doc.getFollowers (err, followers) ->
			if err then return cb(err)
			cb(null, _.extend(doc, {followers:followers}))

UserSchema.methods.followId = (userId, cb) ->
	if not userId
		cb(true)
	Follow.findOneAndUpdate {follower:@.id, followee:userId},
		{},
		{upsert: true},
		(err, doc) ->
			console.log("Now following:", err, doc)
			cb(err, !!doc)

UserSchema.methods.unfollowId = (userId, cb) ->
	Follow.findOneAndRemove {follower:@id, followee:userId},
		(err, doc) ->
			console.log("Now unfollowing:", err, doc)
			cb(err, !!doc)

UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = User = mongoose.model "User", UserSchema