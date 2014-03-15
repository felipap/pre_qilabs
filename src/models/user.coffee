
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

Activity = Resource.model 'Activity'
Notification = mongoose.model 'Notification'

Inbox 	= mongoose.model 'Inbox'
Follow 	= Resource.model 'Follow'
Group 	= Resource.model 'Group'
Post 	= Resource.model 'Post'

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

	tags:	[{
		type: String
	}]
	memberships: [{
		group: { type: String, required: true, ref: 'Group' }
		since: { type: Date, default: Date.now }
		permission: { type: String, enum: _.values(Group.MembershipTypes), required:true, default:'Moderator' }
	}]


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

UserSchema.statics.reInbox = (user, callback) ->

	# Group.Membership.find

	user.getFollowingIds (err, followingIds=[]) ->		

		async.mapLimit followingIds.concat(user.id), 3,((fId, next) ->

			Activity.find {actor:fId}, (err, activities=[]) ->
				if err then console.log(1, err)
				Post.find {author:fId}, (err, posts=[]) ->
					if err then console.log(2, err)
					next(null, posts.concat(activities))

			), (err, posts) ->
				# console.log('err', err, posts)

		# for following in followingIds
		# Inbox.remove({recipient: user})
###
# Behold.
###
UserSchema.methods.getTimeline = (_opts, callback) ->
	# assertArgs({$contains:'limit'}, '$isCb')
	self = @

	User.reInbox(@, () ->)

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
			.find { follower:self, dateBegin:{$gt:minDate} }
			.exec (err, follows) =>
				return callback(err) if err
				# Get posts from these users created before "followship" or maxDate
				# (whichever is older) and after minDate.
				async.mapLimit follows, 5, ((follow, done) =>
					ltDate = Math.min(follow.dateBegin, opts.maxDate) 
					Post
						.find {
							author: follow.followee,
							group: null,
							parentPost: null,
							published: {$lt:ltDate, $gt:minDate}
						}
						.limit opts.limit
						.exec done
					), (err, _docs) ->
						# Flatten lists. Remove undefined (from .limit queries).
						nips = _.flatten(_docs).filter((i)->i)
						onGetNonInboxedPosts(err, nips)

		onGetNonInboxedPosts = (err, nips) ->
			return callback(err) if err
			
			all = _.sortBy(nips.concat(ips), (p) -> p.published) # merge'n'sort by date

			# Populate author in all docs (nips and ips)
			Resource.populate all, {path: 'author actor target object'}, (err, docs) =>
				return callback(err) if err
				# console.log 'docs', docs
				# Fill comments in all docs.
				minDate = if docs.length then docs[docs.length-1].published else 0
				Post.fillComments docs, (err, docs) ->
					callback(err, docs, minDate)

	# Get inboxed posts older than the maxDate determined by the user.
	Inbox
		.find { recipient:self.id, dateSent:{ $lt:opts.maxDate }}
		.sort '-dateSent'
		.populate 'resource'
		.limit opts.limit
		.exec (err, docs) =>
			return cb(err) if err

			# Pluck resources from inbox docs. Remove null (deleted) resources.
			posts = _.pluck(docs, 'resource').filter((i)->i)

			###
			# Get oldest post date
			# Non-inboxed posts must be younger than that, so that at least opts.limit
			# posts are created. 
			###
			if not posts.length or not docs[docs.length-1]
				# Not even opts.limit inboxed posts exist. Get all non-inboxed posts.
				oldestPostDate = 0
			else
				# There are at least opts.limit inboxed posts. 
				# Then limit non-inboxed posts to be younger than oldest post here.
				oldestPostDate = posts[posts.length-1].published

			mergeNonInboxedPosts(oldestPostDate, posts)

UserSchema.statics.getPostsFromUser = (userId, opts, cb) ->
	if not opts.maxDate
		opts.maxDate = Date.now()

	Post
		.find {author:userId, parentPost:null, group:null, published:{$lt:opts.maxDate-1}}
		.sort '-published'
		.populate 'author'
		.limit opts.limit or 4
		.exec HandleLimit (err, docs) ->
			return cb(err) if err

			minPostDate = 1*(docs.length and docs[docs.length-1].published) or 0

			async.parallel [ # Fill post comments and get activities in that time.
				(next) ->
					Activity
						.find {actor:userId, group:null, updated: {
							$lt:opts.maxDate,
							$gt: minPostDate}
						}
						.populate 'resource actor target object'
						.exec next
				(next) ->
					Post.fillComments docs, next
			], HandleLimit (err, results) -> # Merge results and call back
				activities = results[0]
				posts = results[1]
				# Merge and sort by date.
				all = _.sortBy(posts.concat(activities), (p) -> -p.published)
				cb(err, all, minPostDate)

################################################################################
## related to Groups ###########################################################

# This is here because of authentication concerns
UserSchema.methods.getLabPosts = (opts, group, cb) ->
	if not opts.maxDate
		opts.maxDate = Date.now()

	Post
		.find {group:group, parentPost:null, published:{$lt:opts.maxDate}}
		.sort '-published'
		.limit opts.limit or 10
		.populate 'author'
		.exec HandleLimit (err, docs) ->
			return cb(err) if err

			console.log('docs', docs)
			minPostDate = (docs.length && docs[docs.length-1].published) or 0

			async.parallel [ # Fill post comments and get activities in that time.
				(next) ->
					minDate = minPostDate
					Activity
						.find {group:group, updated: {
							$lt:opts.maxDate, $gt:minDate}
						}
						.populate 'resource actor target object'
						.exec next
				(next) ->
					Post.fillComments docs, next
			], (err, results) ->
				activities = results[0]
				posts = results[1]
				# merge results
				all = _.sortBy(results[1].concat(results[0]), (p) -> p.published)
				cb(err, all, minPostDate)

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
		self.update {$push: { memberships: {
			group: group.id,
			type: Group.MembershipTypes.Moderator
		}}}, (err, doc) ->
			console.log 'update result', arguments
			cb(null, group)
			Activity.Trigger(@, Activity.Types.GroupCreated)({group:group, creator:self}, ->)

UserSchema.methods.addUserToGroup = (member, group, cb) ->
	assert _.all([member, group, type, cb]),
		"Wrong number of arguments supplied to User.addUserToGroup"
	# First check for user's own priviledges
	Group.Membership.findOne {group: group, member: @}, (err, mship) =>
		return cb(err) if err
		return cb(error:true,name:'Unauthorized') if not mship or
			mship.type isnt Group.MembershipTypes.Moderator

		# req.user is Moderator → good to go
		Group.Membership.findOne {group: group, member: member}, (err, mem) =>
			console.log(err) if err
			return cb(err, mem) if err
			if mem
				mem.type = Group.MembershipTypes.Member
				mem.save (err) -> cb(err, mem)
			else
				mem = new Group.Membership {
					member: member
					type: Group.MembershipTypes.Member
					group: group
				}
			mem.save (err) =>
				cb(err, mem)
				Activity.Trigger(@, Activity.Types.GroupMemberAdded)({
					group:group, actor:@, member:member
				}, ->)

UserSchema.methods.removeUserFromGroup = (member, group, type, cb) ->
	self = @
	assert _.all([member, group, type, cb]),
		"Wrong number of arguments supplied to User.addUserToGroup"
	# First check for user's own priviledges

	# for membership in self.memberships
	Group.Membership.find {group: group, member: @}, (err, mship) ->
		return cb(err) if err
		return cb(error:true, name:'Unauthorized') if not mship
			# mship.type isnt Group.MembershipTypes.Moderator
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
	self = @
	@getPopulatedFollowers (err1, followers) =>
		if err1 then followers = null
		@getPopulatedFollowing (err2, following) =>
			if err2 then following = null
			self.populate 'memberships.group', (err3, groups) =>
				console.log('groups:', self.memberships, groups, '\n\n')
				if err3 then return cb(err3)
				profile = self.toJSON()
				profile.followers = {
					docs: followers.slice(0,20)
					count: followers.length
				}
				profile.following = {
					docs: following.slice(0,20)
					count: following.length
				}
				profile.groups = {
					docs: _.pluck(self.memberships,'group').slice(0,20)
					count: _.pluck(self.memberships,'group').length
				}
				cb(err1 or err2, profile)

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