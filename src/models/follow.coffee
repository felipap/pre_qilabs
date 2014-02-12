
mongoose = require 'mongoose'

FollowSchema = new mongoose.Schema {
	dateBegin:	Date
	follower: 	{ type: mongoose.Schema.ObjectId, index: 1 }
	followee: 	{ type: mongoose.Schema.ObjectId, index: 1 }
}

FollowSchema.pre 'save', (next) ->
	@dateBegin ?= new Date
	next()

module.exports = mongoose.model "Follow", FollowSchema