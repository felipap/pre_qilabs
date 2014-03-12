
# src/models/user
# Copyright QILabs.org
# by @f03lipe

###
GUIDELINES for development:
- Never utilize directly request parameters or data.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
###

mongoose = require 'mongoose'
_ = require 'underscore'
async = require 'async'
assert = require 'assert'

Resource = mongoose.model 'Resource'
Inbox 	= mongoose.model 'Inbox'
Follow 	= Resource.model 'Follow'
Group 	= mongoose.model 'Group'
Post 	= Resource.model 'Post'
Activity = Resource.model 'Activity'
Notification = mongoose.model 'Notification'

ObjectId = mongoose.Types.ObjectId

################################################################################
## Schema ######################################################################

UserSchema = new mongoose.Schema {
	name:			String
	username: 		String

	lastAccess:		Date
	firstAccess: 	Date

	facebookId:		String
	accessToken:	String

	profile: {
		fullName: 	''
		birthday: 	Date
		email: 		String
		city: 		''
		avatarUrl: 	''
		badges: 		[]
	},

	# I don't know what to do with these (2-mar-14)
	lastUpdate:		{ type: Date, default: Date(0) }
	notifiable:		{ type: Boolean, default: true }
	tags:			Array
	followingTags: 	[]

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

################################################################################
## Middlewares #################################################################

# Must bind to user removal the deletion of:
# - Follows (@=followee or @=follower)
# - Notification (@=agent or @=recipient)
# - Group.Membership (@=member)
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
	Group.Membership.remove {member:@}, (err, count) =>
		console.log "Removing #{err} #{count} memberships of #{@username}"
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
		User.populate docs, { path: 'follower' }, (err, popFollows) ->
			cb(err, _.filter(_.pluck(popFollows, 'follower'),(i)->i))

# Get documents of users that follow @.
UserSchema.methods.getPopulatedFollowing = (cb) -> # Add opts to prevent getting all?
	@getFollowsAsFollower (err, docs) ->
		return cb(err) if err
		User.populate docs, { path: 'followee' }, (err, popFollows) ->
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
	assert user instanceof User, 'Passed argument not a user document'
	if ''+user.id is ''+@.id
		return cb(true)

	Follow.findOne {follower:@, followee:user},
		(err, doc) =>
			unless doc
				doc = new Follow {
					follower: @
					followee: user
				}
				doc.save()
			cb(err, !!doc)

			Notification.Trigger(@, Notification.Types.NewFollower)(@, user, ->)
			Activity.Trigger(@, Notification.Types.NewFollower)({
				follow: doc,
				follower: @,
				followee: user
			}, ->)

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

###
# Behold.
###
UserSchema.methods.getTimeline = (_opts, cb) ->

	opts = _.extend({
		limit: 10,
	}, _opts)

	if not opts.maxDate
		opts.maxDate = Date.now()

	###
	# Merge inboxes posts with those from followed users but that preceed "followship".
	# Limit search to those posts made after @minDate.
	###
	mergeNonInboxedPosts = (minDate, ips) => # ips => Inboxed PostS
		# Get all "followships" created after @minDate.
		Follow
			.find { follower:@, dateBegin:{$gt:minDate} }
			.exec (err, follows) =>
				return cb(err) if err
				# Get posts from these users created before "followship" or maxDate
				# (whichever is older) and after minDate.
				async.mapLimit follows, 5, ((follow, done) =>
					ltDate = Math.min(follow.dateBegin, opts.maxDate) 
					Post
						.find {
							author: follow.followee,
							group: null,
							parentPost: null,
							dateCreated: {$lt:ltDate, $gt:minDate}
						}
						.limit opts.limit
						.exec done
					), (err, _docs) ->
						# Flatten lists. Remove undefined (from .limit queries).
						nips = _.flatten(_docs).filter((i)->i)
						onGetNonInboxedPosts(err, nips)

		onGetNonInboxedPosts = (err, nips) ->
			return cb(err) if err
			
			all = _.sortBy(nips.concat(ips), (p) -> p.dateCreated) # merge'n'sort by date

			# Populate author in all docs (nips and ips)
			Resource.populate all, {path: 'author actor target object'}, (err, docs) =>
				return cb(err) if err
				console.log 'docs', docs
				# Fill comments in all docs.
				Post.fillComments(docs, cb)

	# Get inboxed posts older than the maxDate determined by the user.
	Inbox
		.find { recipient:@id, dateSent:{ $lt:opts.maxDate }}
		.sort '-dateSent'
		.populate 'resource'
		.limit opts.limit
		.exec HandleLimit (err, docs) =>
			return cb(err) if err
			# Pluck resources from inbox docs. Remove undefineds and nulls.
			posts = _.pluck(docs, 'resource').filter((i)->i)

			###
			# Get oldest post date
			# Non-inboxed posts must be younger than that, so that at least opts.limit
			# posts are created. 
			###
			if posts.length is opts.limit
				# There are at least opts.limit inboxed posts. 
				# Then limit non-inboxed posts to be younger than oldest post here.
				oldestPostDate = posts[posts.length-1].dateCreated
			else
				# Not even opts.limit inboxed posts exist. Get all non-inboxed posts.
				oldestPostDate = new Date(0)
			try
				mergeNonInboxedPosts(oldestPostDate, posts)
			# catch e
			# 	cb(e)

UserSchema.statics.getPostsFromUser = (userId, opts, cb) ->
	Post
		.find {author:userId, parentPost:null, group:null}
		.sort '-dateCreated'
		.populate 'author'
		.limit opts.limit or 10
		.skip opts.skip or 0
		.exec (err, docs) ->
			return cb(err) if err
			Post.fillComments(docs, cb)

################################################################################
## related to Groups ###########################################################

# This is here because of authentication concerns
UserSchema.methods.getLabPosts = (opts, group, cb) ->
	if not opts.maxDate
		opts.maxDate = Date.now()

	Post
		.find {group:group, parentPost:null, dateCreated:{$lt:opts.maxDate}}
		.limit opts.limit or 10
		.skip opts.skip or 0
		.populate 'author'
		.exec (err, docs) ->
			Post.fillComments(docs, cb)

UserSchema.methods.createGroup = (data, cb) ->
	group = new Group {
		profile: {
			name: data.profile.name
		}
	}
	group.save (err, group) =>
		return cb(err) if err
		group.addUser @, Group.Membership.Types.Moderator, (err, membership) ->
			cb(err, group)

UserSchema.methods.addUserToGroup = (member, group, type, cb) ->
	assert _.all([member, group, type, cb]),
		"Wrong number of arguments supplied to User.addUserToGroup"
	# First check for user's own priviledges
	Group.Membership.findOne {group: group, member: @}, (err, mship) ->
		return cb(err) if err
		return cb(error:true,name:'Unauthorized') if not mship or
			mship.type isnt Group.Membership.Types.Moderator

		# req.user is Moderator → good to go
		Group.Membership.findOne {group: group, member: member}, (err, mem) ->
			return cb(err, mem) if err
			if mem
				mem.type = type
				mem.save (err) -> cb(err, mem)
			else
				mem = new Group.Membership {
					member: member
					type: type
					group: group
				}
				mem.save (err) -> cb(err, mem)

UserSchema.methods.removeUserFromGroup = (member, group, type, cb) ->
	assert _.all([member, group, type, cb]),
		"Wrong number of arguments supplied to User.addUserToGroup"
	# First check for user's own priviledges
	Group.Membership.find {group: group, member: @}, (err, mship) ->
		return cb(err) if err
		return cb(error:true, name:'Unauthorized') if not mship
			# mship.type isnt Group.Membership.Types.Moderator
		# req.user is Moderator → good to go
		Group.Membership.remove {group: group, member: member}, (err, mem) ->
			return cb(err, mem) if err

################################################################################
## related to the Posting ######################################################

###
Create a post object with type comment.
###
UserSchema.methods.commentToPost = (parentPost, data, cb) ->
	# Detect repeated posts and comments!
	comment = new Post {
		author: @
		group: parentPost.group
		data: {
			body: data.content.body
		}
		parentPost: parentPost
		type: Post.Types.Comment
	}
	comment.save cb

	Notification.Trigger(@, Notification.Types.PostComment)(comment, parentPost, ->)

###
Create a post object and fan out through inboxes.
###
UserSchema.methods.createPost = (data, cb) ->

	post = new Post {
		author: @id
		data: {
			title: data.content.title
			body: data.content.body
		},
		type: Post.Types?.PlainPost or 'PlainPost'
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
		@getPopulatedFollowers (err, followers) =>
			Inbox.fillInboxes([@].concat(followers), {
				resource: post.id,
				type: Inbox.Types.Post,
				author: @id
			}, () -> )

################################################################################
## related to the generation of profiles #######################################

###
Generate stuffed profile for the controller.
###
UserSchema.methods.genProfile = (cb) ->
	@getPopulatedFollowers (err1, followers) =>
		if err1 then followers = null
		@getPopulatedFollowing (err2, following) =>
			if err2 then following = null
			Group.Membership
				.find {member: @}
				.populate 'group'
				.exec (err3, memberships) =>
					profile = _.extend(@,{})
					if followers
						profile.followers = {
							docs: followers.slice(0,20)
							count: followers.length
						}
					if following
						profile.following = {
							docs: following.slice(0,20)
							count: following.length
						}
					if memberships
						profile.groups = _.pluck(memberships, 'group')
					cb(err1 or err2 or err3, profile)

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