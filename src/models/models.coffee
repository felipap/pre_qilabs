
# User and Post models.
# Reference: https://github.com/madhums/node-express-mongoose-demo
# Removed from example:
# - validation of removed fields,
# - virtual password (which was removed)

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

PostSchema = new mongoose.Schema {
		id:					type: Number,
		tumblrId:			type: String,
		tags:				type: Array,
		lastUpdated:		type: Date,		default: Date(0)
		urlTemplate:		type: String,	default: '/{id}'
	}, { id: false }

# Virtuals
PostSchema.virtual('path').get(() ->
	return @urlTemplate.replace(/{id}/, @id);
)

# Methods
UserSchema.methods = {}
PostSchema.methods = {}

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


# Taken from https://github.com/drudge/mongoose-findorcreate
UserSchema.statics.findOrCreate = findOrCreate
PostSchema.static.findOrCreate = findOrCreate

module.exports = {
	User: mongoose.model "User", UserSchema
	Post: mongoose.model "Post", PostSchema
}