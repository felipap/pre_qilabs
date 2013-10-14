
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
		lastUpdate:			{ type: Date, 	default: Date(0) }
	}, { id: true } # default

# Virtuals


# Methods
UserSchema.methods = {}

# Taken from https://github.com/drudge/mongoose-findorcreate
findOrCreate = (conditions, doc, options, callback) ->
	if arguments.length < 4
		if typeof options is 'function' # Scenario: findOrCreate(conditions, doc, callback)
			callback = options
			options = {}
		else if typeof doc is 'function' # Scenario: findOrCreate(conditions, callback);
			callback = doc
			doc = {}
			options = {}
	
	self = this;
	@findOne conditions, (err, result) ->
		if err or result
			if options and options.upsert and not err
				self.update(conditions, doc, (err, count) ->
					self.findOne(conditions, (err, result) ->
						callback(err, result, false)
					)
				)
			else
				callback(err, result, false)
		else
			conditions = _.extend(conditions, doc)
			obj = new self(conditions)
			obj.save (err) ->
				callback(err, obj, true)


UserSchema.statics.findOrCreate = findOrCreate

module.exports = mongoose.model "User", UserSchema