
# User module.
# Reference: https://github.com/madhums/node-express-mongoose-demo
# Removed from example:
# - validation of removed fields,
# - virtual password (which was removed)

mongoose = require 'mongoose'
crypto = require 'crypto'
_ = require 'underscore'

authTypes = []

# Schema
UserSchema = new mongoose.Schema
	name:				type: String, 	default: ''
	tags:				type: Array,  	default: ''
	facebookId:			type: String, 	default: ''
	accessToken:		type: String,	default: ''
	lastUpdate:			type: Date, 	default: Date(0)

# Methods
UserSchema.methods = {}

# Taken from https://github.com/drudge/mongoose-findorcreate
UserSchema.plugin(findOrCreate = (schema, options) ->
	schema.statics.findOrCreate = (conditions, doc, options, callback) ->
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
				for key in doc
					conditions[key] = doc[key]
				obj = new self(conditions)
				obj.save (err) ->
					callback(err, obj, true)
)

module.exports = mongoose.model "User", UserSchema