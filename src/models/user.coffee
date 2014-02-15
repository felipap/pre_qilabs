
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
	
	portfolio: {
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

UserSchema.methods.doesFollowId = (userId, cb) ->
	if not userId
		cb(true)
	Follow.findOne {followee:userId, follower:@id},
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
## related to the Timeline and Inboxes

UserSchema.methods.getTimeline = (opts, cb) ->
	Inbox
		.find {recipient: @id}
		.sort '-dateSent'
		.populate 'post'
		.select 'post'
		.limit opts.limit or 10
		.skip opts.skip or 0
		.exec (err, inboxes) ->
			if err then return cb(err)
			User.populate inboxes, {path:'post.author'}, (err, docs) ->
				if err then return cb(err)
				results = []
				docs = _.filter(_.pluck(docs, 'post'), (i) -> i)
				async.forEach docs, (post, asyncCb) ->
						Post.find {parentPost: post}
							.populate 'author'
							.exec (err, comments) ->
								console.log 'post', post
								results.push(_.extend({}, post.toObject(), {comments: comments}))
								asyncCb()
					, (err) -> cb(err, results)


UserSchema.statics.getPostsFromUser = (userId, opts, cb) ->
	# Inbox.getUserPosts @, opts, (err, docs) ->
	Post
		.find {author: userId, parentPost: null}
		.sort '-dateCreated'
		.populate 'author'
		.limit opts.limit or 10
		.skip opts.skip or null
		.exec (err, docs) ->
			if err then return cb(err)
			results = []
			async.forEach [d if d for d in docs], (post, asyncCb) ->
					Post.find {parentPost: post}
						.populate 'author'
						.exec (err, comments) ->
							console.log 'post', post
							results.push(_.extend({}, post.toObject(), {comments: comments}))
							asyncCb()
				, (err) -> cb(err, results)

UserSchema.statics.getPostsToUser = (userId, opts, cb) ->
	# Inbox.getUserPosts @, opts, (err, docs) ->
	Post
		.find {author: userId, parentPost: null}
		.sort '-dateCreated'
		.populate 'author'
		.exec (err, posts) ->
			console.log('posts', posts)
			cb(err, posts)

###
Generate stuffed profile for the controller.
###
UserSchema.statics.genProfileFromUsername = (username, cb) ->
	User.findOne {username: username}, (err, doc) ->
		if err or not doc then return cb(err)
		unless doc then return cb(null, doc)
		doc.getFollowers (err, followers) ->
			if err then return cb(err)
			doc.getFollowing (err, following) ->
				if err then return cb(err)
				cb(null, _.extend(doc, {followers:followers, following:following}))

UserSchema.statics.genProfileFromModel = (userModel, cb) ->
	userModel.getFollowers (err, followers) ->
		if err then return cb(err)
		userModel.getFollowing (err, following) ->
			if err then return cb(err)
			cb(null, _.extend(userModel, {followers:followers, following:following}))



###
Create a post object with type comment.
###
UserSchema.methods.commentToPost = (parentPost, data, cb) ->
	# Detect repeated posts and comments
	post = new Post {
		author: @
		group: null
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
		group: null
		data: {
			title: data.content.title
			body: data.content.body
		},
		# parentPost: '52fd556aee90f63350000001'
	}

	post.save (err, post) =>
			console.log('yes, here', err, post)
			# use asunc.parallel to run a job
			# Callback now, what happens later doesn't concern the user.
			cb(err, post)
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

UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = User = mongoose.model "User", UserSchema