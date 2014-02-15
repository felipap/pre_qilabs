
# src/models/group
# Copyright QILabs.org
# by @f03lipe

###
Membership is accessible at Group.Membership
###

################################################################################
################################################################################

mongoose = require 'mongoose'

Types =
	StudyGroup: 'StudyGroup'

MembershipTypes =
	Moderator: 	'Moderator'
	User:		'User'

# Schema
GroupSchema = new mongoose.Schema {
	slug: 				String
	dateCreated: 		Date
	affiliation: 		'' 			# institution, project, NGOs etc (/????)
	type: 				String
	profile: {
		name:			{ type: String, required: true }
		description: 	String
	}
}, { id: true } # default

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
	@dateCreated ?= new Date
	next()

# Methods
GroupSchema.methods.addUserToGroup = (user, group, cb) ->
	MembershipSchema

GroupSchema.methods.genGroupProfile = (cb) ->
	cb(false, @toObject())

MembershipSchema.statics.Types = MembershipTypes

GroupSchema.statics.Types = Types
GroupSchema.statics.findOrCreate = require('./lib/findOrCreate')
GroupSchema.statics.Membership = Membership = mongoose.model "Membership", MembershipSchema

module.exports = mongoose.model "Group", GroupSchema