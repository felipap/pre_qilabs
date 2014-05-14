
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
PopulateFields = '-memberships -accesssToken -firstAccess -followingTags'

ObjectId = mongoose.Types.ObjectId

################################################################################
## Schema ######################################################################

UserSchema = new mongoose.Schema {
	name:			{ type: String }
	username:		{ type: String }

	lastAccess:		{ type: Date, select: false }
	firstAccess:	{ type: Date, select: false }
	facebookId:		{ type: String }
	accessToken:	{ type: String, select: false }

	followingTags: 	[]

	profile: {
		fullName: 	''
		birthday: 	Date
		email: 		String
		city: 		''
		avatarUrl: 	''
		badges: 	[]
	},

	stats: {
		posts:	{ type: Number, default: 0 }
		votes:	{ type: Number, default: 0 }
		followers:	{ type: Number, default: 0 }
		following:	{ type: Number, default: 0 }
	}
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

UserSchema.virtual('avatarUrl').get ->
	if @username is 'felipearagaopires'
		'/static/images/avatar.png'
	else
		'https://graph.facebook.com/'+@facebookId+'/picture?width=200&height=200'

UserSchema.virtual('profile.strAge').get ->
	if @username is 'felipearagaopires'
		'18 anos'
	else
		'19 anos'

UserSchema.virtual('profile.location').get ->
	if @username is 'felipearagaopires'
		'Harvard University, USA' # 'Massachusetts Institute of Technology, Cambridge, US'
	else
		'Stanford, Palo Alto, Estados Unidos'

UserSchema.virtual('profile.from').get ->
	if @username is 'felipearagaopires'
		'Rio de Janeiro, Brasil'
	else
		'Rio de Janeiro, Brasil'

UserSchema.virtual('profile.bgUrl').get ->
	if @username is 'felipearagaopires'
		'/static/images/u/sta.jpg'
		# '/static/images/u/mit.jpg'
	else
		'/static/images/rio.jpg'
		# if Math.random()>.5
		# else

UserSchema.virtual('profile.bio').get ->
	if @username is 'felipearagaopires'
		'QI Labs Founder. Open source enthusiast. I believe I can program my way into changing the world. My heros are Richard Feynman, Alan Turing and Valesca Popozuda.'
	else
		'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' 

UserSchema.virtual('profileUrl').get ->
	'/u/'+@username

UserSchema.virtual('path').get ->
	'/u/'+@username

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
		cb(err, _.pluck(docs or [], 'follower'))

# Get id of users that follow @.
UserSchema.methods.getFollowingIds = (cb) ->
	@getFollowsAsFollower (err, docs) ->
		cb(err, _.pluck(docs or [], 'followee'))

#### Stats

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
				user.update {$inc: {'stats.followers': 1}}, ->
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
	assertArgs({$isModel:User}, '$isCb')
	Follow.findOne { follower:@, followee:user },
		(err, doc) =>
			return cb(err) if err
			if doc then doc.remove cb
			user.update {$dec: {'stats.followers': 1}}, ->

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
		.limit opts.limit or 20
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
					Post.countList docs, next
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
		# .limit 30
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
					async.map docs, (post, done) ->
						if post instanceof Post
							Post.count {type:'Comment', parentPost:post}, (err, ccount) ->
								Post.count {type:'Answer', parentPost:post}, (err, acount) ->
									done(err, _.extend(post.toJSON(), {childrenCount:{Answer:acount,Comment:ccount}}))
						else done(null, post.toJSON)
					, (err, results) ->
						callback(err, results, minDate)

UserSchema.statics.PopulateFields = PopulateFields

UserSchema.statics.getUserTimeline = (user, opts, cb) ->
	assertArgs({$isModel:User}, {$contains:'maxDate'})
	fetchTimelinePostAndActivities(
		{maxDate: opts.maxDate},
		{group:null, author:user, parentPost:null},
		{actor:user, group:null},
		(err, all, minPostDate) -> cb(err, all, minPostDate)
	)

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
	assertArgs({$contains:['content','type','tags']}, '$isCb')
	post = new Post {
		author: self.id
		data: {
			title: data.content.title
			body: data.content.body
		},
		type: data.type
		tags: data.tags
	}
	if data.groupId
		post.group = data.groupId

	self = @
	post.save (err, post) =>
		console.log('post save:', err, post)
		# use asunc.parallel to run a job
		# Callback now, what happens later doesn't concern the user.
		cb(err, post)
		if err then return
		if post.group
			return

		self.update { $inc: { 'stats.posts': 1 }}, ->

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
	post.votes.addToSet(''+@id)
	post.save(cb)

	if not post.parentPost
		User.findById post.author, (err, author) ->
			if not err
				author.update { $inc: { 'stats.votes': 1 }}, ->

UserSchema.methods.unupvotePost = (post, cb) ->
	assertArgs({$isModel:Post}, '$isCb')
	if (i = post.votes.indexOf(@.id)) > -1
		post.votes.splice(i,1)
		post.save(cb)
	else
		return cb(null, post)

################################################################################
## related to the generation of profiles #######################################

###
Generate stuffed profile for the controller.
###
UserSchema.methods.genProfile = (cb) ->
	cb(null, @toJSON())

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