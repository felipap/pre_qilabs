
mongoose = require 'mongoose'

FollowSchema = new mongoose.Schema {
	dateStarted:	Date
	follower: 		{ type: mongoose.Schema.ObjectId, index: 1 }
	followee: 		{ type: mongoose.Schema.ObjectId, index: 1 }
}

FollowSchema.pre 'save', (next) ->
	@dateStarted ?= new Date
	next()

module.exports = mongoose.model "Follow", FollowSchema