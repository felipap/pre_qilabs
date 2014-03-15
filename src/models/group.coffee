
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

Resource = mongoose.model 'Resource'
Activity = mongoose.model 'Activity'

Types =
	StudyGroup: 'StudyGroup'

Permissions =
	Public: 'Public'
	Private: 'Private'

MembershipTypes =
	Moderator: 	'Moderator'
	Member:		'Member'

################################################################################
## Schemas #####################################################################

GroupSchema = new Resource.Schema {
	slug: 				String
	creationDate: 		Date
	# affiliation: 		'' 			# institution, project, NGOs etc (/????)
	type: 				String
	name:				{ type:String, required:true }
	profile:{
		description:	String
	}
	visibility:			{ type:String, default:Permissions.Public, enum:_.values(Permissions) }
}

MembershipSchema = new Resource.Schema {
	joinDate: 	Date,
	type: 		{ type: String, required: true }
	member:		{ type: mongoose.Schema.ObjectId, index: 1, ref: 'User' }
	group: 		{ type: mongoose.Schema.ObjectId, index: 1, ref: 'Group' }
}

################################################################################
## Virtuals ####################################################################

GroupSchema.virtual('path').get ->
	'/labs/'+@slug

################################################################################
## Middlewares #################################################################

GroupSchema.pre 'save', (next) ->
	@slug ?= ''+@id
	@creationDate ?= new Date
	next()

MembershipSchema.pre 'save', (next) ->
	console.assert _.values(MembershipSchema.statics.Types).indexOf(@type) isnt -1,
		"Invalid membership type: #{@type}"
	@joinDate ?= new Date
	next()

################################################################################
## Methods #####################################################################

GroupSchema.methods.addUser = (user, type, cb) ->
	cb ?= type
	membership = new Membership {
		member: user
		group: @
		type: (cb and type) or MembershipTypes.Member
	}
	membership.save(cb)

GroupSchema.methods.genGroupProfile = (cb) ->
	User
		.find { 'groups.group': @ }
		.exec (err, docs) =>
			# Filter for non-member-less memberships, just in case
			cb(err, _.extend({}, @toJSON(), {
				memberships: {
					count: docs.groups.length
					docs: docs.groups.slice(20)
				}
			}))

################################################################################
## Statics #####################################################################

GroupSchema.statics.MembershipTypes = MembershipTypes
MembershipSchema.statics.Types = MembershipTypes

GroupSchema.statics.Types = Types
GroupSchema.statics.Permissions = Permissions
GroupSchema.statics.findOrCreate = require('./lib/findOrCreate')
GroupSchema.statics.Membership = Membership = mongoose.model "Membership", MembershipSchema

GroupSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Group = Resource.discriminator "Group", GroupSchema