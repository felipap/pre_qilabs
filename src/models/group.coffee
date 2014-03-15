
# src/models/group
# Copyright QILabs.org
# by @f03lipe


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

################################################################################
## Methods #####################################################################

GroupSchema.methods.genGroupProfile = (cb) ->
	User = Resource.model('User')
	User
		.find { 'memberships.group': @ }
		.exec (err, docs) =>
			# Filter for non-member-less memberships, just in case
			cb(err, _.extend({}, @toJSON(), {
				members: {
					count: docs.length
					docs: docs.slice(20)
				}
			}))

################################################################################
## Statics #####################################################################

GroupSchema.statics.MembershipTypes = MembershipTypes

GroupSchema.statics.Types = Types
GroupSchema.statics.Permissions = Permissions
GroupSchema.statics.findOrCreate = require('./lib/findOrCreate')

GroupSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Group = Resource.discriminator "Group", GroupSchema