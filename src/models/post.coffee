
# models/post.coffee
# for meavisa.org, by @f03lipe

# Post model.

mongoose = require 'mongoose'
crypto = require 'crypto'
_ = require 'underscore'

authTypes = []

# Schema
PostSchema = new mongoose.Schema {
		tumblrId:			{ type: Number, }
		tags:				{ type: Array, }
		urlTemplate:		{ type: String,	default: '/{id}' }
		tumblrUrl:			{ type: String }
		tumblrPostType:		{ type: String }
		date:				{ type: Date }
	}, { id: false }

# Virtuals
PostSchema.virtual('path').get(() ->
	return @urlTemplate.replace(/{id}/, @id);
)

# Methods
PostSchema.methods = {}

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


PostSchema.statics.findOrCreate = findOrCreate

module.exports = mongoose.model "Post", PostSchema