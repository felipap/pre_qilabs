
# models/user.coffee
# for meavisa.org, by @f03lipe

# User model.
# Reference: https://github.com/madhums/node-express-mongoose-demo
# Removed from example:
# - validation of removed fields,
# - virtual password

mongoose = require 'mongoose'
crypto = require 'crypto'
_ = require 'underscore'

authTypes = []

# Schema
UserSchema = new mongoose.Schema {
		name:				{ type: String, }
		tags:				{ type: Array,	default: [] }
		facebookId:			{ type: String, }
		accessToken:		{ type: String, }
		lastUpdate:			{ type: Date, 	default: Date(0) },
		notifiable:			{ type: Boolean, default: true }
	}, { id: true } # default

# Virtuals

UserSchema.virtual('avatarUrl').get ->
	'https://graph.facebook.com/'+@facebookId+'/picture'

# Methods
UserSchema.methods = {}

UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = mongoose.model "User", UserSchema