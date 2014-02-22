
# src/models/user
# Copyright QILabs.org
# by @f03lipe

###
GUIDELINES for development:
- Never utilize directly request parameters or data.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
###

################################################################################
################################################################################

mongoose = require 'mongoose'
_ = require 'underscore'
async = require 'async'

Inbox 	= mongoose.model 'Inbox'
Follow 	= mongoose.model 'Follow'
Post 	= mongoose.model 'Post'
Group 	= mongoose.model 'Group'

ObjectId = mongoose.Types.ObjectId

################################################################################
################################################################################
# The Schema

UserSchema = new mongoose.Schema {
	name:			String
	username: 		String
	tags:			Array

	notifiable:		{ type: Boolean, default: true }
	lastUpdate:		{ type: Date, default: Date(0) }
	firstAccess: 	Date
	
	facebookId:		String
	accessToken:	String

	profile: {
		fullName: 	''
		birthday: 	Date
		email: 		String
		city: 		''
		avatarUrl: 	''
	},

	badges: 		[]
	followingTags: 	[]
}, { id: true } # default

# Virtuals
UserSchema.virtual('avatarUrl').get ->
	'https://graph.facebook.com/'+@facebookId+'/picture'

UserSchema.virtual('profileUrl').get ->
	'/p/'+@username

################################################################################
## related to Following

UserSchema.methods.getFollowers = (cb) -> # Add opts to prevent getting all?
	Follow.find {followee: @}, (err, docs) ->
		return cb(err) if err
		followers = _.filter(_.pluck(docs, 'follower'), (i) -> i)
		User.find {_id: {$in:followers}}, cb

UserSchema.methods.getFollowing = (cb) -> # Add opts to prevent getting all?
	Follow.find {follower: @}, (err, docs) ->
		return cb(err) if err
		followees = _.filter(_.pluck(docs, 'followee'), (i) -> i)
		User.find {_id: {$in:followees}}, cb

UserSchema.methods.countFollowers = (cb) ->
	Follow.count {followee: @}, cb

UserSchema.methods.countFollowees = (cb) ->
	Follow.count {follower: @}, cb

UserSchema.methods.doesFollowUser = (user, cb) ->
	console.assert(user instanceof User, 'Passed argument not a user document')
	Follow.findOne {followee:user.id, follower:@id}, (err, doc) -> cb(err, !!doc)

#### Actions

UserSchema.methods.dofollowUser = (user, cb) ->
	console.assert(user instanceof User, 'Passed argument not a user document')
	Follow.findOne {follower:@, followee:user},
		(err, doc) =>
			unless doc
				doc = new Follow {
					follower: @
					followee: user
				}
				doc.save()
			cb(err, !!doc)

UserSchema.methods.unfollowUser = (user, cb) ->
	console.assert(user instanceof User, 'Passed argument not a user document')
	Follow.findOne { follower:@, followee:user },
		(err, doc) =>
			return cb(err) if err
			doc.remove cb
			Inbox.remove { recipient:@, author:user }, () ->
				console.log("inbox removed?", arguments)

################################################################################
## related to fetching Timelines and Inboxes

HandleLimit = (func) ->
	return (err, _docs) ->
		docs = _.filter(_docs, (e) -> e)
		func(err,docs)

fillInPostComments = (docs, cb) ->
	results = []
	async.forEach _.filter(docs, (i) -> i), (post, asyncCb) ->
			Post.find {parentPost: post}
				.populate 'author'
				.exec (err, comments) ->
					if post.toObject
						results.push(_.extend({}, post.toObject(), { comments:comments }))
					else
						results.push(_.extend({}, post, { comments:comments }))
					asyncCb()
		, (err) -> cb(err, results)

###
# Behold.
###
UserSchema.methods.getTimeline = (_opts, cb) ->

	opts = _.extend({
		limit: 10,
		skip: 0,
	}, _opts)

	###
	# Merge inboxes posts with those from followed users but that preceed "followship".
	# Limit search to those posts made after @minDate.
	###
	addNonInboxedPosts = (minDate, ips) => # ips => Inboxed PostS
		# Get all "followships" created after @minDate.
		Follow
			.find { follower:@, dateBegin:{$gt:minDate} }
			.exec (err, follows) =>
				return cb(err) if err
				# Get posts from these users created before "followship" and after minDate.
				async.mapLimit follows, 5, ((follow, done) =>
					Post
						.find {
							author: follow.followee,
							group: null,
							parentPost: null,
							dateCreated: {$lt:follow.dateBegin, $gt:minDate}
						}
						.limit opts.limit
						.exec done
					), (err, _docs) ->
						docs = _.filter(_docs, (i) -> i) # prevent null from .limit
						onGetNonInboxedPosts(err, _.flatten(docs).filter((i)->i))

		onGetNonInboxedPosts = (err, nips) ->
			return cb(err) if err

			console.log 'every:', _.all(nips), _.all(ips)
			
			all = _.sortBy(nips.concat(ips), (p) ->
				p.dateCreated
			) # merge n sort
			
			User.populate all, {path: 'author'}, (err, docs) =>
				return cb(err) if err
				# console.log 'follows', docs, minDate
				fillInPostComments(docs, cb)


	# Get inboxed posts.
	Inbox
		.find {recipient: @id, type:Inbox.Types.Post}
		.sort '-dateSent'
		.populate 'resource'
		.limit opts.limit
		.skip opts.skip
		.exec HandleLimit((err, docs) =>
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
				oldestPostDate = posts[-1].dateCreated
			else
				# Not even opts.limit inboxed posts exist. Get all non-inboxed posts.
				oldestPostDate = new Date(0)
			# try
			addNonInboxedPosts(oldestPostDate, posts)
			# catch e
			# 	cb(e)
		)

UserSchema.statics.getPostsFromUser = (userId, opts, cb) ->
	Post
		.find {author:userId, parentPost:null, group:null}
		.sort '-dateCreated'
		.populate 'author'
		.limit opts.limit or 10
		.skip opts.skip or 0
		.exec (err, docs) ->
			return cb(err) if err
			fillInPostComments(docs, cb)

################################################################################
## related to Groups

# This is here because of authentication concerns
UserSchema.methods.getLabPosts = (opts, group, cb) ->
	Post
		.find {group:group, parentPost:null}
		.limit opts.limit or 10 
		.skip opts.skip or 0
		.populate 'author'
		.exec (err, docs) ->
			fillInPostComments(docs, cb)

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
	console.assert _.all([member, group, type, cb]),
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
	console.assert _.all([member, group, type, cb]),
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
## related to the Posting

###
Create a post object with type comment.
###
UserSchema.methods.commentToPost = (parentPost, data, cb) ->
	# Detect repeated posts and comments
	post = new Post {
		author: @
		group: parentPost.group
		data: {
			body: data.content.body
		}
		parentPost: parentPost
		postType: Post.PostTypes.Comment
	}
	post.save cb

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
		# parentPost: '52fd556aee90f63350000001'
	}
	if data.groupId
		post.group = data.groupId

	post.save (err, post) =>
			# console.log('yes, here', err, post)
			# use asunc.parallel to run a job
			# Callback now, what happens later doesn't concern the user.
			# console.log('porra4')
			cb(err, post)
			# console.log('porra3')
			if post.group
				return
			# console.log('porra2')
			# Iter through followers and fill inboxes.
			@getFollowers (err, followers) =>
				console.log('porra', err, followers)
				Inbox.fillInboxes({
					recipients: [@].concat(followers),
					resource: post,
					type: Inbox.Types.Post,
					author: @id
				}, () -> )

################################################################################
## related to the generation of profiles

###
Generate stuffed profile for the controller.
###
UserSchema.methods.genProfile = (cb) ->
	@getFollowers (err1, followers) =>
		if err1 then followers = null
		@getFollowing (err2, following) =>
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


UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = User = mongoose.model "User", UserSchema