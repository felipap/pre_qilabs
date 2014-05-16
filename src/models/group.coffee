
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
		.find { 'memberships.group': @id }
		.exec (err, docs) =>
			# Filter for non-member-less memberships, just in case
			cb(err, _.extend({}, @toJSON(), {
				members: {
					count: docs.length
					docs: docs.slice(0,20)
				}
			}))

################################################################################
## Statics #####################################################################

# UserSchema.methods.getLabTimeline = (group, opts, cb) ->
# 	assertArgs({$isModel:Group}, {$contains:'maxDate'}) # isId:'User', }
# 	fetchTimelinePostAndActivities(
# 		{maxDate: opts.maxDate},
# 		{group:group, parentPost:null},
# 		{group:group},
# 		(err, all, minPostDate) -> console.log('err', err); cb(err, all, minPostDate)
# 	)

################################################################################
## related to Groups ###########################################################

# UserSchema.methods.createGroup = (data, cb) ->
# 	# assertArgs
# 	self = @
# 	group = new Group {
# 		name: data.profile.name
# 		profile: {
# 			name: data.profile.name
# 		}
# 	}
# 	group.save (err, group) =>
# 		console.log(err, group)
# 		return cb(err) if err
# 		self.update {$push: {
# 			memberships: {
# 				member: self
# 				permission: Group.MembershipTypes.Moderator
# 				group: group.id
# 			}
# 		}}, () ->
# 			cb(null, group)
# 			Activity.Trigger(@, Activity.Types.GroupCreated)({group:group, creator:self}, ->)

# UserSchema.methods.addUserToGroup = (user, group, cb) ->
# 	self = @
# 	assertArgs({$isModel:'User'}, {$isModel:'Group'}, '$isCb')
# 	if mem = _.findWhere(user.memberships, {group:group.id})
# 		return cb()
# 	else
# 		user.update {$push: {
# 			memberships: {
# 				member: user
# 				permission: Group.MembershipTypes.Member
# 				group: group.id
# 			}
# 		}}, (err) =>
# 			cb(err, mem)
# 			Activity.Trigger(@, Activity.Types.GroupMemberAdded)({
# 				group:group, actor:@, member:user
# 			}, ->)


# UserSchema.methods.removeUserFromGroup = (member, group, type, cb) ->
# 	self = @
# 	mem = _.findWhere(user.memberships, {group:group.id})
# 	if mem
# 		return cb()
# 	else
# 		user.update {$pull: { memberships: { group: group.id } }}, (err) =>
# 			cb(err, mem)
# 			Activity.Trigger(@, Activity.Types.GroupMemberAdded)({
# 				group:group, actor:@, member:user
# 			}, ->)



GroupSchema.statics.MembershipTypes = MembershipTypes

GroupSchema.statics.Types = Types
GroupSchema.statics.Permissions = Permissions
GroupSchema.statics.findOrCreate = require('./lib/findOrCreate')

GroupSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Group = Resource.discriminator "Group", GroupSchema