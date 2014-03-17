
# src/models/post
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
assertArgs = require './lib/assertArgs'

ObjectId = mongoose.Schema.ObjectId

Notification = mongoose.model 'Notification'
Resource = mongoose.model 'Resource'

Types = 
	Comment: 'Comment'
	Answer: 'Answer'
	PlainPost: 'PlainPost'
	QA: 'QA'
	VideoPost: 'VideoPost'
	Notification: 'Notification'
	# QuizPost: 'QuizPost'

################################################################################
## Schema ######################################################################

PostSchema = new Resource.Schema {
	author:		{ type: ObjectId, ref: 'Resource', required: true, indexed: 1 }
	group:		{ type: ObjectId, ref: 'Group', required: false }
	type: 		{ type: String, required: true, enum:_.values(Types) }
	parentPost:	{ type: ObjectId, ref: 'Post', required: false }
	
	updated:	{ type: Date }
	published:	{ type: Date, indexed: 1 }
	data: {
		title:	{ type: String, required: false }
		body:	{ type: String, required: true }
	},

	tags:		[{ type: String }]
	
	voteSum:	{ type: Number, default: 0 }
	votes: 	[{
		voter: 	{ type: String, ref: 'User', required: true }
		when:	{ type: Date, default: Date.now }
	}]
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

PostSchema.virtual('path').get ->
	if @parentPost
		"/posts/"+@parentPost+"#"+@id
	else
		"/posts/{id}".replace(/{id}/, @id)

PostSchema.virtual('apiPath').get ->
	"/api/posts/{id}".replace(/{id}/, @id)

urlify = (text) ->
	urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
	return text.replace urlRegex, (url) ->
	    return "<a href=\"#{url}\">#{url}</a>"

PostSchema.virtual('data.unescapedBody').get ->
	urlify(@data.body)

################################################################################
## Middlewares #################################################################

PostSchema.pre 'remove', (next) ->
	next()
	Notification.find { resources: @ }, (err, docs) =>
		console.log "Removing #{err} #{docs.length} notifications of resource #{@id}"
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'remove', (next) ->
	next()
	Post.find { parentPost: @ }, (err, docs) ->
		docs.forEach (doc) ->
			doc.remove()

PostSchema.pre 'save', (next) ->
	@published ?= new Date
	@updated ?= new Date
	next()

################################################################################
## Methods #####################################################################

PostSchema.methods.getComments = (cb) ->
	Post.find { parentPost: @id }
		.populate 'author'
		.exec (err, docs) ->
			cb(err, docs)

PostSchema.methods.stuff = (cb) ->
	@.populate 'author', (err, doc) ->
		if err
			cb(err)
		else if doc
			doc.fillChildren(cb)
		else
			cb(false,null)

PostSchema.methods.fillChildren = (cb) ->
	self = @
	if @type not in ['PlainPost', 'Answer']
		cb(false, @toJSON())

	Post.find {parentPost:@}
	.populate 'author'
	.exec (err, children) =>
		comments = _.filter(children, (i) -> i.type is Types.Comment)
		_answers = _.filter(children, (i) -> i.type is Types.Answer)
		
		async.forEach _answers, ((ans, done) ->
			Post.find({parentPost:ans}).populate('author').exec (err, comments) ->
				done(err, _.extend({},ans.toJSON(), { comments: comments }))
		), (err, answers) ->
			cb(err, _.extend({}, self.toJSON(), { comments:comments, answers:answers }))

################################################################################
## Statics #####################################################################

PostSchema.statics.fillChildren = (docs, cb) ->
	assertArgs({$isA:Array},'$isCb')
	results = []
	async.forEach _.filter(docs, (i) -> i), (post, done) ->
			Post.find {parentPost:post}
				.populate 'author'
				.exec (err, children) ->
					comments = _.filter(children, (i) -> i.type is Types.Comment)
					answers = _.filter(children, (i) -> i.type is Types.Answer)
					if post.toObject
						results.push(_.extend({}, post.toObject(), {
							comments: comments,
							answers: answers
						}))
					else
						results.push(_.extend({}, post, {
							comments: comments
							answers: answers
						}))
					done()
		, (err) ->
			if err then console.log 'Error in fillinpostcomments', err
			cb(err, results)

PostSchema.statics.Types = Types

PostSchema.plugin(require('./lib/hookedModelPlugin'))

module.exports = Post = Resource.discriminator('Post', PostSchema)