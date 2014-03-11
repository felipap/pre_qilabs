
mongoose = require 'mongoose'
util = require 'util'

ResourceSchema = () ->
	mongoose.Schema.apply(@, arguments)

util.inherits(ResourceSchema, mongoose.Schema)

module.exports = mongoose.model('Resource', new ResourceSchema)