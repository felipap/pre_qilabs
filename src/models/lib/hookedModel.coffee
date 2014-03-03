
# Create a special mongoose model that removes static methods that circumvent (don't fire)
# mongoose middlewares, namely: .update, .findByIdAndUpdate, .findOneAndUpdate,
# .findOneAndRemove and .findByIdAndRemove.
# See: http://mongoosejs.com/docs/middleware.html

mongoose = require 'mongoose'

circumventionists = [
	# 'update',
	'findByIdAndUpdate',
	'findOneAndUpdate',
	'findOneAndRemove',
	'findByIdAndUpdate',
]

module.exports = (name, schema, collection, skipInit) ->
	for smname in circumventionists
		schema.statics[smname] = () ->
			throw "Invalid static method call on hookedModel. Use document methods."

	mongoose.model name, schema, collection, skipInit
