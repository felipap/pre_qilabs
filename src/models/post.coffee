
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
	Question: 'Question'
	VideoPost: 'VideoPost'
	Notification: 'Notification'
	# QuizPost: 'QuizPost'

TransTypes = {}
TransTypes[Types.Question] = 'Pergunta'

################################################################################
## Schema ######################################################################

PostSchema = new Resource.Schema {
	author:		{ type: ObjectId, ref: 'User', required: true, indexed: 1 }
	group:		{ type: ObjectId, ref: 'Group', required: false }
	parentPost:	{ type: ObjectId, ref: 'Post', required: false }
	
	updated:	{ type: Date }
	published:	{ type: Date, indexed: 1 }
	
	title:		{ type: String }
	type: 		{ type: String, required: true, enum:_.values(Types) }
	data: {
		title:		{ type: String }
		body:	{ type: String, required: true }
	},

	tags:		[{ type: String }]
	
	votes: 		{ type: [{ type: String, ref: 'User', required: true }], select: true, default: [] }
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

PostSchema.virtual('translatedType').get ->
	TransTypes[@type] or 'Publicação'

PostSchema.virtual('voteSum').get ->
	# for m of @ when m isnt 'voteSum'
	# 	console.log m
	# console.log 'me', @id, 'votes' in @, @isSelected('votes')
	@votes.length

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

PostSchema.virtual('data.escapedBody').get ->
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

	if @type not in _.values(Types)
		return cb(false, @toJSON())

	Post.find {parentPost:@}
		.populate 'author'
		.exec (err, children) =>
			async.map children, ((c, done) =>
				if c.type in [Types.Answer]
					Post.find({parentPost:c}).populate('author').exec (err, comments) ->
						done(err, _.extend({}, c.toJSON(), { comments: comments }))
				else
					done(null, c)
			), (err, popChildren) =>
				cb(err, _.extend(@toJSON(), {children:_.groupBy(popChildren, (i) -> i.type)}))

################################################################################
## Statics #####################################################################

PostSchema.statics.stuffList = (docs, cb) ->
	assertArgs({$isA:Array},'$isCb')

	async.map docs, (post, done) ->
			if post instanceof Post
				post.fillChildren(done)
			else done(null, post)
		, (err, results) ->
			cb(err, results)

PostSchema.statics.Types = Types

PostSchema.plugin(require('./lib/hookedModelPlugin'))

module.exports = Post = Resource.discriminator('Post', PostSchema)