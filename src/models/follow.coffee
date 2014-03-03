
# src/models/follow
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
hookedModel = require './lib/hookedModel'

Inbox = mongoose.model 'Inbox'

################################################################################
## Follow Schema ###############################################################

FollowSchema = new mongoose.Schema {
	dateBegin:	{ type: Date, index: 1 }
	follower: 	{ type: mongoose.Schema.ObjectId, index: 1 }
	followee: 	{ type: mongoose.Schema.ObjectId, index: 1 }
}

################################################################################
## Middlewares #################################################################

# Remove inboxes on unfollow
FollowSchema.pre 'remove', (next) ->
	Inbox.remove { recipient:@follower, author:@followee }, () ->
		console.log("Inbox removed on unfollow. Args:", arguments)
		next()

FollowSchema.pre 'save', (next) ->
	@dateBegin ?= new Date
	next()

module.exports = hookedModel "Follow", FollowSchema