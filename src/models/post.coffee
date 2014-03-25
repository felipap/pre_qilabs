
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
	author:		{ type: ObjectId, ref: 'User', required: true, indexed: 1 }
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

smallify = (url) ->
	if url.length > 30
	# src = /((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+).{20}/.exec(url)[0]
	# '...'+src.slice(src.length-30)
		'...'+/https?:(?:\/\/)?[A-Za-z0-9][A-Za-z0-9\-]*([A-Za-z0-9\-]{2}\.[A-Za-z0-9\.\-]+(\/.{0,20})?)/.exec(url)[1]+'...'
	else url

urlify = (text) ->
	urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/
	return text.replace urlRegex, (url) ->
	    return "<a href=\"#{url}\">#{smallify(url)}</a>"

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
		.populate 'author', '-memberships'
		.exec (err, docs) ->
			cb(err, docs)

PostSchema.methods.stuff = (cb) ->
	@populate 'author', (err, doc) ->
		if err
			cb(err)
		else if doc
			doc.fillChildren(cb)
		else
			cb(false,null)

PostSchema.methods.fillChildren = (cb) ->
	self = @
	if @type not in _.values(Types)
		return cb(false, @toJSON())

	Post.find {parentPost:@}
		.populate 'author', '-memberships'
		.exec (err, children) =>
			async.map children, ((c, done) ->
				if c.type in [Types.Answer]
					Post.find({parentPost:c}).populate('author').exec (err, comments) ->
						done(err, _.extend({}, c.toJSON(), { comments: comments }))
				else
					done(null, c)
			), (err, popChildren) ->
				cb(err, _.extend(self.toJSON(), {children:_.groupBy(popChildren, (i) -> i.type)}))

################################################################################
## Statics #####################################################################

PostSchema.statics.hydrateList = (docs, cb) ->
	assertArgs({$isA:Array},'$isCb')

	async.map _.filter(docs, (i) -> i), (post, done) ->
			Post.find {parentPost:post}
				.populate 'author', '-memberships'
				.exec (err, children) ->
					async.map children, ((c, done) ->
						if c.type in [Types.Answer]
							Post.find({parentPost:c}).populate('author','-memberships').exec (err, comments) ->
								done(err, _.extend({}, c.toJSON(), { comments: comments }))
						else
							done(null, c)
					), (err, popChildren) ->
						done(err, _.extend(post.toJSON(), {children:_.groupBy(popChildren, (i) -> i.type)}))
		, (err, results) ->
			if err then console.log 'Error in fillinpostcomments', err
			cb(err, results)

PostSchema.statics.Types = Types

PostSchema.plugin(require('./lib/hookedModelPlugin'))

module.exports = Post = Resource.discriminator('Post', PostSchema)