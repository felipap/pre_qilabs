
mongoose = require 'mongoose'
util = require 'util'

BaseSchema = () ->
	mongoose.Schema.apply(@, arguments)

util.inherits(BaseSchema, mongoose.Schema)
