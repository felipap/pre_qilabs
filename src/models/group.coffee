
# src/models/group
# Copyright QILabs.org
# by @f03lipe

###
Membership is accessible at Group.Membership
###

################################################################################
################################################################################

mongoose = require 'mongoose'
_ = require 'underscore'

Types =
	StudyGroup: 'StudyGroup'

Permissions =
	Public: 'Public'
	Private: 'Private'

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
	permissions: 		{ type: String, default: Permissions.Private }
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
	console.assert _.values(MembershipSchema.statics.Types).indexOf(@type) isnt -1,
		"Invalid membership type: #{@type}"
	@joinDate ?= new Date
	next()

# Methods
GroupSchema.methods.addUser = (user, type, cb) ->
	cb ?= type
	membership = new Membership {
		member: user
		group: @
		type: (cb and type) or MembershipTypes.Member
	}
	membership.save(cb)

GroupSchema.methods.genGroupProfile = (cb) ->
	Membership
		.find {group: @}
		.populate 'member'
		.exec (err, docs) =>
			cb(err, _.extend({}, @toObject(), {memberships:docs}))

MembershipSchema.statics.Types = MembershipTypes

GroupSchema.statics.Types = Types
GroupSchema.statics.Permissions = Permissions
GroupSchema.statics.findOrCreate = require('./lib/findOrCreate')
GroupSchema.statics.Membership = Membership = mongoose.model "Membership", MembershipSchema

module.exports = mongoose.model "Group", GroupSchema