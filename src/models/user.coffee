
# src/models/user
# Copyright QILabs.org
# by @f03lipe

###
GUIDELINES for development:
- Never utilize directly request parameters or data.
###

mongoose = require 'mongoose'
_ = require 'underscore'
async = require 'async'
assert = require 'assert'

assertArgs = require './lib/assertArgs'

Resource = mongoose.model 'Resource'

Activity = Resource.model 'Activity'
Notification = mongoose.model 'Notification'

Inbox 	= mongoose.model 'Inbox'
Follow 	= Resource.model 'Follow'
Group 	= Resource.model 'Group'
Post 	= Resource.model 'Post'

# PopulateFields = 'name username path profileUrl avatarUrl data followee follower updated published parentPost type voteSum'
PopulateFields = '-memberships -accesssToken -facebookId -firstAccess -lastAccess -lastUpdate -notifiable'

ObjectId = mongoose.Types.ObjectId

################################################################################
## Schema ######################################################################

UserSchema = new mongoose.Schema {
	name:			{ type: String }
	username:		{ type: String }

	lastAccess:		{ type: Date, select: false }
	firstAccess:	{ type: Date, select: false }
	facebookId:		{ type: String, select: true }
	accessToken:	{ type: String, select: false }

	profile: {
		fullName: 	''
		birthday: 	Date
		email: 		String
		city: 		''
		avatarUrl: 	''
		badges: 	[]
	},

	tags: [{ type: String }]
	memberships: { type: [{
		group: { type: String, required: true, ref: 'Group' }
		since: { type: Date, default: Date.now }
		permission: { type: String, enum: _.values(Group.MembershipTypes), required:true, default:'Moderator' }
	}], select: false}

	# I don't know what to do with these (2-mar-14)
	followingTags: 	[]
	lastUpdate:		{ type: Date, default: Date(0) }
	notifiable:		{ type: Boolean, default: true }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

UserSchema.virtual('avatarUrl').get ->
	'https://graph.facebook.com/'+@facebookId+'/picture'

UserSchema.virtual('profileUrl').get ->
	'/p/'+@username

UserSchema.virtual('path').get ->
	'/p/'+@username

################################################################################
## Middlewares #################################################################

# Must bind to user removal the deletion of:
# - Follows (@=followee or @=follower)
# - Notification (@=agent or @=recipient)
# - Post (@=author)

UserSchema.pre 'remove', (next) ->
	Follow.find().or([{followee:@}, {follower:@}]).exec (err, docs) =>
		if docs
			for follow in docs
				follow.remove(() ->)
		console.log "Removing #{err} #{docs.length} follows of #{@username}"
		next()

UserSchema.pre 'remove', (next) ->
	Post.find {author:@}, (err, docs) =>
		if docs
			for doc in docs
				doc.remove(() ->)
		console.log "Removing #{err} #{docs.length} posts of #{@username}"
		next()

UserSchema.pre 'remove', (next) ->
	Notification.find().or([{agent:@},{recipient:@}]).remove (err, docs) =>
		console.log "Removing #{err} #{docs} notifications related to #{@username}"
		next()

UserSchema.pre 'remove', (next) ->
	Activity.remove {actor:@}, (err, docs) =>
		console.log "Removing #{err} #{docs} activities related to #{@username}"
		next()

################################################################################
## related to Following ########################################################

# Get Follow documents where @ is followee.
UserSchema.methods.getFollowsAsFollowee = (cb) ->
	Follow.find {followee: @, follower: {$ne: null}}, cb

# Get Follow documents where @ is follower.
UserSchema.methods.getFollowsAsFollower = (cb) ->
	Follow.find {follower: @, followee: {$ne: null}}, cb

#

# Get documents of users that @ follows.
UserSchema.methods.getPopulatedFollowers = (cb) -> # Add opts to prevent getting all?
	@getFollowsAsFollowee (err, docs) ->
		return cb(err) if err
		User.populate docs,
			{ path: 'follower', select: User.PopulateFields },
			(err, popFollows) ->
				cb(err, _.filter(_.pluck(popFollows, 'follower'),(i)->i))

# Get documents of users that follow @.
UserSchema.methods.getPopulatedFollowing = (cb) -> # Add opts to prevent getting all?
	@getFollowsAsFollower (err, docs) ->
		return cb(err) if err
		User.populate docs,
			{ path: 'followee', select: User.PopulateFields },
			(err, popFollows) ->
				cb(err, _.filter(_.pluck(popFollows, 'followee'),(i)->i))

#

# Get id of users that @ follows.
UserSchema.methods.getFollowersIds = (cb) ->
	@getFollowsAsFollowee (err, docs) ->
		console.log docs, _.pluck(docs or [], 'follower')
		cb(err, _.pluck(docs or [], 'follower'))

# Get id of users that follow @.
UserSchema.methods.getFollowingIds = (cb) ->
	@getFollowsAsFollower (err, docs) ->
		cb(err, _.pluck(docs or [], 'followee'))

#### Stats

UserSchema.methods.countFollowers = (cb) ->
	Follow.count {followee: @}, cb

UserSchema.methods.countFollowees = (cb) ->
	Follow.count {follower: @}, cb

UserSchema.methods.doesFollowUser = (user, cb) ->
	assert user instanceof User, 'Passed argument not a user document'
	Follow.findOne {followee:user.id, follower:@id}, (err, doc) -> cb(err, !!doc)

#### Actions

UserSchema.methods.dofollowUser = (user, cb) ->
	assertArgs({$isModel:'User'},'$isCb')
	self = @
	if ''+user.id is ''+self.id # Can't follow myself
		return cb(true)

	Follow.findOne {follower:self, followee:user},
		(err, doc) =>
			unless doc
				doc = new Follow {
					follower: self
					followee: user
				}
				doc.save()
			cb(err, !!doc)

			# Notify followed user
			Notification.Trigger(self, Notification.Types.NewFollower)(self, user, ->)
			# Trigger creation of activity to timeline
			Activity.Trigger(self, Notification.Types.NewFollower)({
				follow: doc,
				follower: self,
				followee: user
			}, ->)
			# Populate follower inbox with at most 100 resources from followed user
			Resource.find()
				.or [{__t:'Post', group:null, parentPost:null, author:user._id},{__t:'Activity', group:null, actor:user._id}]
				.limit(100)
				.exec (err, docs) ->
					console.log 'Resources found:', err, docs.length
					Inbox.fillUserInboxWithResources(self, docs, ->)

UserSchema.methods.unfollowUser = (user, cb) ->
	assert user instanceof User, 'Passed argument not a user document'
	Follow.findOne { follower:@, followee:user },
		(err, doc) =>
			return cb(err) if err
			if doc then doc.remove cb

################################################################################
## related to fetching Timelines and Inboxes ###################################

HandleLimit = (func) ->
	return (err, _docs) ->
		docs = _.filter(_docs, (e) -> e)
		func(err,docs)

fetchTimelinePostAndActivities = (opts, postConds, actvConds, cb) ->
	assertArgs({$contains:['maxDate']})

	Post
		.find _.extend({parentPost:null, published:{$lt:opts.maxDate-1}}, postConds)
		.sort '-published'
		.populate 'author'
		.limit opts.limit or 10
		.exec HandleLimit (err, docs) ->
			return cb(err) if err
			minPostDate = 1*(docs.length and docs[docs.length-1].published) or 0
			async.parallel [ # Fill post comments and get activities in that time.
				(next) ->
					Activity
						.find _.extend(actvConds, updated:{$lt:opts.maxDate,$gt:minPostDate})
						.populate 'resource actor target object'
						.exec next
				(next) ->
					Post.hydrateList docs, next
			], HandleLimit (err, results) -> # Merge results and call back
				all = _.sortBy((results[0]||[]).concat(results[1]), (p) -> -p.published)
				cb(err, all, minPostDate)
###
# Behold.
###
UserSchema.methods.getTimeline = (opts, callback) ->
	assertArgs({$contains:'maxDate'}, '$isCb')
	self = @
	
	# Get inboxed posts older than the opts.maxDate determined by the user.
	Inbox
		.find { recipient:self.id, dateSent:{ $lt:opts.maxDate }}
		.sort '-dateSent' # tied to selection of oldest post below
		.populate 'resource'
		.limit 20
		.exec (err, docs) =>
			return cb(err) if err
			# Pluck resources from inbox docs. Remove null (deleted) resources.
			posts = _.pluck(docs, 'resource').filter((i)->i)
			console.log "#{posts.length} posts gathered from inbox"
			if not posts.length or not docs[docs.length-1]
				# Not even opts.limit inboxed posts exist.
				# Pass minDate=0 to prevent newer fetches.
				minDate = 0
			else# Pass minDate=oldestPostDate, to start newer fetches from there.
				minDate = posts[posts.length-1].published
			
			Resource
				.populate posts, {
					path: 'author actor target object', select: User.PopulateFields
				}, (err, docs) =>
					return callback(err) if err
					Post.hydrateList docs, (err, docs) ->
						callback(err, docs, minDate)

UserSchema.statics.PopulateFields = PopulateFields

UserSchema.statics.getUserTimeline = (user, opts, cb) ->
	assertArgs({$isModel:User}, {$contains:'maxDate'})
	fetchTimelinePostAndActivities(
		{maxDate: opts.maxDate},
		{group:null, author:userId, parentPost:null},
		{actor:userId, group:null},
		(err, all, minPostDate) -> cb(err, all, minPostDate)
	)

UserSchema.methods.getLabTimeline = (group, opts, cb) ->
	assertArgs({$isModel:Group}, {$contains:'maxDate'}) # isId:'User', }
	fetchTimelinePostAndActivities(
		{maxDate: opts.maxDate},
		{group:group, parentPost:null},
		{group:group},
		(err, all, minPostDate) -> console.log('err', err); cb(err, all, minPostDate)
	)

################################################################################
## related to Groups ###########################################################

UserSchema.methods.createGroup = (data, cb) ->
	# assertArgs
	self = @
	group = new Group {
		name: data.profile.name
		profile: {
			name: data.profile.name
		}
	}
	group.save (err, group) =>
		console.log(err, group)
		return cb(err) if err
		self.update {$push: {
			memberships: {
				member: self
				permission: Group.MembershipTypes.Moderator
				group: group.id
			}
		}}, () ->
			cb(null, group)
			Activity.Trigger(@, Activity.Types.GroupCreated)({group:group, creator:self}, ->)

UserSchema.methods.addUserToGroup = (user, group, cb) ->
	self = @
	assertArgs({$isModel:'User'}, {$isModel:'Group'}, '$isCb')
	if mem = _.findWhere(user.memberships, {group:group.id})
		return cb()
	else
		user.update {$push: {
			memberships: {
				member: user
				permission: Group.MembershipTypes.Member
				group: group.id
			}
		}}, (err) =>
			cb(err, mem)
			Activity.Trigger(@, Activity.Types.GroupMemberAdded)({
				group:group, actor:@, member:user
			}, ->)


UserSchema.methods.removeUserFromGroup = (member, group, type, cb) ->
	self = @
	mem = _.findWhere(user.memberships, {group:group.id})
	if mem
		return cb()
	else
		user.update {$pull: { memberships: { group: group.id } }}, (err) =>
			cb(err, mem)
			Activity.Trigger(@, Activity.Types.GroupMemberAdded)({
				group:group, actor:@, member:user
			}, ->)


################################################################################
## related to the Posting ######################################################

###
Create a post object with type comment.
###
UserSchema.methods.postToParentPost = (parentPost, data, cb) ->
	assertArgs({$isModel:Post},{$contains:['content','type']},'$isCb')
	# Detect repeated posts and comments!
	comment = new Post {
		author: @
		group: parentPost.group
		data: {
			body: data.content.body
		}
		parentPost: parentPost
		type: data.type
	}
	comment.save cb

	Notification.Trigger(@, Notification.Types.PostComment)(comment, parentPost, ->)

###
Create a post object and fan out through inboxes.
###
UserSchema.methods.createPost = (data, cb) ->
	self = @
	assertArgs({$contains:['content','type']}, '$isCb')
	post = new Post {
		author: self.id
		data: {
			title: data.content.title
			body: data.content.body
		},
		type: data.type
	}
	if data.groupId
		post.group = data.groupId

	post.save (err, post) =>
		console.log('post save:', err, post)
		# use asunc.parallel to run a job
		# Callback now, what happens later doesn't concern the user.
		cb(err, post)
		if err then return
		if post.group
			return
		# Make separate job for this.
		# Iter through followers and fill inboxes.
		self.getPopulatedFollowers (err, followers) =>
			Inbox.fillInboxes([self].concat(followers), {
				resource: post.id,
				type: Inbox.Types.Post,
				author: self.id
			}, () -> )


UserSchema.methods.upvotePost = (post, cb) ->
	assertArgs({$isModel:Post}, '$isCb')
	post.votes.addToSet(''+@.id)
	post.save(cb)

UserSchema.methods.unupvotePost = (post, cb) ->
	assertArgs({$isModel:Post}, '$isCb')
	post.update {$pull:{votes:''+@}}, (err, doc) ->
		console.log 'arguments', arguments

################################################################################
## related to the generation of profiles #######################################

###
Generate stuffed profile for the controller.
###
UserSchema.methods.genProfile = (cb) ->
	self = @
	@getPopulatedFollowers (err, followers) =>
		if err then return cb(err)

		@getPopulatedFollowing (err, following) =>
			if err then return cb(err)

			self.populate 'memberships.group', (err, me) =>
				if err then return cb(err)

				groups = _.filter(me.memberships, (i) -> i and i.group)

				profile = _.extend(self.toJSON(), {
					followers: {
						docs: followers.slice(0,20)
						count: followers.length
					}
					following: {
						docs: following.slice(0,20)
						count: following.length
					}
					groups: {
						docs: _.pluck(groups,'group').slice(0,20)
						count: _.pluck(groups,'group').length
					}
				})

				cb(null, profile)

################################################################################
## related to the notification #################################################

UserSchema.methods.getNotifications = (cb) ->
	Notification
		.find { recipient:@ }
		.limit(6)
		.sort '-dateSent'
		.exec cb

UserSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = User = Resource.discriminator "User", UserSchema