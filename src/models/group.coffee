
# src/models/group
# Copyright QILabs.org
# by @f03lipe

###
Membership is accessible at Group.Membership
###

################################################################################
################################################################################

mongoose = require 'mongoose'

Post = mongoose.model 'Post'

Types =
	StudyGroup: 'StudyGroup'

# Schema
GroupSchema = new mongoose.Schema {
	slug: 				String
	creationDate: 		Date
	affiliation: 		'' 			# institution, project, NGOs etc (/????)
	type: 				String
	profile: {
		name:			{ type: String, required: true }
		description: 	String
	}
}, { id: true } # default

MembershipTypes =
	Moderator: 	'Moderator'
	Member:		'Member'

MembershipSchema = new mongoose.Schema {
	joinDate: 	Date,
	type: 		{ type: String, required: true }
	member:		{ type: mongoose.Schema.ObjectId, index: 1, ref: 'User' }
	group: 		{ type: mongoose.Schema.ObjectId, index: 1, ref: 'Group' }
}

GroupSchema.virtual('path').get ->
	'/labs/'+@slug

GroupSchema.pre 'save', (next) ->
	@slug ?= ''+@id
	@creationDate ?= new Date
	next()

MembershipSchema.pre 'save', (next) ->
	@joinDate ?= new Date
	next()

# Methods
GroupSchema.methods.addUser = (user, cb) ->
	membership = new Membership {
		user: user
		group: @
		member: MembershipTypes.Member
	}
	membership.save(cb)

GroupSchema.methods.genGroupProfile = (cb) ->
	cb(false, @toObject())

MembershipSchema.statics.Types = MembershipTypes

GroupSchema.statics.Types = Types
GroupSchema.statics.findOrCreate = require('./lib/findOrCreate')
GroupSchema.statics.Membership = Membership = mongoose.model "Membership", MembershipSchema

module.exports = mongoose.model "Group", GroupSchema