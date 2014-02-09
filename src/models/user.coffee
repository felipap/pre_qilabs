
# models/user.coffee
# for meavisa.org, by @f03lipe

mongoose = require 'mongoose'
crypto = require 'crypto'

authTypes = []

# Schema
UserSchema = new mongoose.Schema {
		name:		{ type: String, }
		tags:			{ type: Array, default: [] }
		facebookId:		{ type: String, }
		accessToken:	{ type: String, }
		notifiable:		{ type: Boolean, default: true }
		lastUpdate:		{ type: Date, default: Date(0) }
		
		firstAccess: 	Date
		
		profile: {
			fullName: 	''
			birthday: 	Date
			city: 		''
			avatarUrl: 	''
		},

		badges: []
		groups: []
		followingTags: []
	}, { id: true } # default

# Virtuals

UserSchema.virtual('avatarUrl').get ->
	'https://graph.facebook.com/'+@facebookId+'/picture'

# Methods
UserSchema.methods = {}

UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = mongoose.model "User", UserSchema