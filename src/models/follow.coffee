
# src/models/follow
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'

Inbox = mongoose.model 'Inbox'

FollowSchema = new mongoose.Schema {
	dateBegin:	{ type: Date, index: 1 }
	follower: 	{ type: mongoose.Schema.ObjectId, index: 1 }
	followee: 	{ type: mongoose.Schema.ObjectId, index: 1 }
}

# Remove inboxes on unfollow
FollowSchema.pre 'remove', (next) ->
	Inbox.remove { recipient:@follower, author:@followee }, () ->
		console.log("Inbox removed on unfollow. Args:", arguments)
		next()

FollowSchema.pre 'save', (next) ->
	@dateBegin ?= new Date
	next()

module.exports = mongoose.model "Follow", FollowSchema