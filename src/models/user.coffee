
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

# Schema
UserSchema = new mongoose.Schema {
	name:			String
	username: 		String
	tags:			Array
	facebookId:		String
	accessToken:	String

	notifiable:		{ type: Boolean, default: true }
	lastUpdate:		{ type: Date, default: Date(0) }
	firstAccess: 	Date
	
	contact: {
		email: 		String
	}
	
	profile: {
		fullName: 	''
		birthday: 	Date
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

UserSchema.methods.getFollowers = (cb) ->
	Follow.find {followee: @id}, (err, docs) ->
		console.log('found follow relationships:',  _.pluck(docs, 'follower'))
		User.find {_id: {$in: _.pluck(docs, 'follower')}}, (err, docs) ->
			# console.log('found:', err, docs)
			cb(err, docs)

UserSchema.methods.getFollowing = (cb) ->
	Follow.find {follower: @id}, (err, docs) ->
		User.find {_id: {$in: _.pluck(docs, 'followee')}}, (err, docs) ->
			# console.log('found:', err, docs)
			cb(err, docs)

UserSchema.methods.countFollowers = (cb) ->
	Follow.count {followee: @id}, (err, count) ->
		cb(err, count)

UserSchema.methods.doesFollowUser = (user2, cb) ->
	console.assert(user2.id, 'Passed argument not a user document')
	Follow.findOne {followee: user2.id, follower:@id},
		(err, doc) ->
			cb(err, !!doc)

#### Actions

UserSchema.methods.followId = (userId, cb) ->
	if not userId
		cb(true)
	Follow.findOne {follower:@.id, followee:userId},
		(err, doc) ->
			unless doc
				doc = new Follow {
					follower: @.id
					followee: userId
				}
				doc.save()
			console.log("Now following:", err, doc)
			cb(err, !!doc)

UserSchema.methods.unfollowId = (userId, cb) ->
	Follow.findOne {follower:@id, followee:userId},
		(err, doc) ->
			console.log("Now unfollowing:", err, doc)
			doc.remove (err, num) ->
				cb(err, !!num)

################################################################################
## related to fetching Timelines and Inboxes

fillComments = (docs, cb) ->
	results = []
	async.forEach _.filter(docs, (i) -> i), (post, asyncCb) ->
			Post.find {parentPost: post}
				.populate 'author'
				.exec (err, comments) ->
					results.push(_.extend({}, post.toObject(), {comments: comments}))
					asyncCb()
		, (err) -> cb(err, results)


# UserSchema.statics.getPostsToUser = (userId, opts, cb) ->
UserSchema.methods.getTimeline = (opts, cb) ->
	Inbox
		.find {recipient: @id}
		.sort '-dateSent'
		.populate 'post'
		.select 'post'
		.limit opts.limit or 10
		.skip opts.skip or 0
		.exec (err, inboxes) ->
			return cb(err) if err
			User.populate inboxes, {path:'post.author'}, (err, docs) ->
				return cb(err) if err
				fillComments(_.pluck(docs, 'post'), cb)

UserSchema.statics.getPostsFromUser = (userId, opts, cb) ->
	# Inbox.getUserPosts @, opts, (err, docs) ->
	Post
		.find {author: userId, parentPost: null}
		.sort '-dateCreated'
		.populate 'author'
		.limit opts.limit or 10
		.skip opts.skip or null
		.exec (err, docs) ->
			return cb(err) if err
			fillComments(docs, cb)

################################################################################
## related to Groups

# This is here because of authentication concerns
UserSchema.methods.addToGroups = (opts, group, cb) ->
	Post
		.find {group: group}
		.limit opts.limit or 10 
		.skip opts.skip or 0
		.populate 'author'
		.exec (err, docs) ->
			fillComments(docs, cb)

# This is here because of authentication concerns
UserSchema.methods.getLabPosts = (opts, group, cb) ->
	Post
		.find {group: group}
		.limit opts.limit or 10 
		.skip opts.skip or 0
		.populate 'author'
		.exec (err, docs) ->
			fillComments(docs, cb)

UserSchema.methods.createGroup = (data, cb) ->
	group = new Group {
		profile: {
			name: data.profile.name
		}
	}
	group.save (err, group) =>
		return cb(err) if err
		group.addMember @, (err, membership) ->
			cb(err, group)

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
			console.log('yes, here', err, post)
			# use asunc.parallel to run a job
			# Callback now, what happens later doesn't concern the user.
			cb(err, post)
			if post.group
				return
			# Iter through followers and fill inboxes.
			@getFollowers (err, docs) =>
				Inbox.create {
					author: @id,
					recipient: @id,
					post: post,
				}, () -> ;

				for follower in docs
					# Inbox.createFromPost
					Inbox.create {
						author: @id,
						recipient: follower.id,
						post: post,
					}, () -> ;

################################################################################
## related to the generation of profiles

###
Generate stuffed profile for the controller.
###
UserSchema.methods.genProfile = (cb) ->
	@getFollowers (err, followers) =>
		return cb(err) if err
		@getFollowing (err, following) =>
			return cb(err) if err
			cb(null, _.extend(@, {followers:followers, following:following}))



UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = User = mongoose.model "User", UserSchema