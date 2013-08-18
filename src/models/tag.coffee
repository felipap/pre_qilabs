
# Post model.
# Reference: https://github.com/madhums/node-express-mongoose-demo
# Removed from example:
# - validation of removed fields,

mongoose = require 'mongoose'
crypto = require 'crypto'
_ = require 'underscore'

authTypes = []

# Schema
TagSchema = new mongoose.Schema {
		description:		{ type: String, }
		name:				{ type: String, }
		children:			{ type: Array, }
	}

# Virtuals

# Methods
TagSchema.methods = {}

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
			for key in doc
				conditions[key] = doc[key]
			obj = new self(conditions)
			obj.save (err) ->
				callback(err, obj, true)


TagSchema.static.findOrCreate = findOrCreate

module.exports = mongoose.model "Tag", TagSchema