
# models/group.coffee
# for qilabs.org, by @f03lipe

mongoose = require 'mongoose'
crypto = require 'crypto'

authTypes = []

# Schema
GroupSchema = new mongoose.Schema {
	name:		{ type: String, }
	tags:		{ type: Array, default: [] }
	firstAccess: Date
	affiliation: '' 				# institution, project, NGOs etc
	type: ''
	
	badges: []
	groups: []
	followingTags: []
}, { id: true } # default

FollowSchema = new mongoose.Schema {
	start: Date,
	follower: '',
	followee: '',
}

# Virtuals

UserSchema.virtual('avatarUrl').get ->
	'https://graph.facebook.com/'+@facebookId+'/picture'

# Methods
UserSchema.methods = {}

UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = mongoose.model "User", UserSchema