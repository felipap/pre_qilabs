
###
# models/tag.coffee
# for meavisa.org, by @f03lipe
#
# Tag model.
###

mongoose = require 'mongoose'
crypto = require 'crypto'
memjs = require 'memjs'
_ = require 'underscore'

findOrCreate = require('./lib/findOrCreate')
api = require('./../api')

authTypes = []

# Schema
TagSchema = new mongoose.Schema {
		name:				{ type: String, }
		children:			{ type: Array, }
		description:		{ type: String, }
	}

# Virtuals

# Methods
TagSchema.methods = {}

`String.prototype.toCamel = function(){
	return this.replace(/([a-z]+)/g, function(a){return a[0].toUpperCase()+a.slice(1);});
};`

transTable = {
	'estagio': 'Estágio',
	'olimpiadas': 'Olimpíadas',
	'voluntariado': 'Voluntariado',
	'bolsasdeestudo': 'Bolsas de Estudo',
	'matematica': 'Matemática',
	'cursos': 'Cursos',
	'intercambio': 'Intercâmbio',
}

descTable = {
#	'estagio': 'Oportunidades de estágio para ...',
	'olimpiadas:matematica': 'Novidades sobre a <a href="#">OBM</a>, <a href="#">OBMEP</a>, olimpíadas de matemática estaduais e cursos relacionados à elas.',
	'intercambio': 'Já pensou em estudar no exterior? É possível! Siga a tag para saber sobre bolsas de estudo, palestras e outros eventos relacionados a intercâmbio.',
	'mun': 'O Modelo das Nações unidas (Model United Nations) é um modelo de organizações internacionais realizado por estudantes para simular o funcionamento da ONU e, assim, desenvolverem suas habilidades de falar em público.'
}

###
# Turn a horizontal list of tags into a recursive structure with label and children.
# TODO! this implementation looks expensive
# TODO! Rename this to buildTag, or smthing.
###
recursify = (tags) ->
	tagsObj = {hashtag:'', label: null, children: {}}
	for hashtag in tags
		tagList = hashtag.split(':')
		parent = tagsObj
		while tagList.length
			hashtag = tagList.shift()
			# Build composed hashtag (with <parent>:<hashtag>)
			chashtag = parent.hashtag+(unless parent.hashtag then '' else ':')+hashtag
			parent = parent.children[hashtag] ?= {
				hashtag: 	chashtag
				label:		getLabel(hashtag),
				description:getDescription(chashtag)
				children:	{}}
	# counter = 0
	# for hashtag, tag of tagsObj.children
	# 	tag.children = {'estagio':_.clone(tagsObj.children['estagio'])}
	# 	tag.children['estagio'].label += counter++
	# console.log(tagsObj.children)
	return tagsObj.children

###
# Takes as input
@param rtags 	{Array} 	A recursive tags object
@param followed {Array} 	A plain list of tags the user follows.
@return rtags 	{Object}	Recursive tags object with attrs checked in each tag
###
checkFollowed = (rtags, followed) ->
	_.each rtags, check = (e, i) ->
		_.each(e.children, check)
		e.checked = if e.hashtag in followed then true else false
	return rtags

getDescription = (hashtag) ->
	return descTable[hashtag.toLowerCase()] || ''

getLabel = (hashtag) ->
	# Try to match lower(hashtag) or return a "beautified" version of hashtag.
	return transTable[hashtag.toLowerCase()] or hashtag.toCamel()

blog_url = 'http://meavisa.tumblr.com'
blog = api.getBlog 'meavisa.tumblr.com'

TagSchema.statics.getAll = (cb) ->
	@getCached (err, results) =>
		if err or not results.length
			api.pushBlogTags(blog,
				(err, _tags) =>
					cb(err) if err
					tags = @recursify(_tags)
					cb(null, tags)
			)
		else
			cb(null, results)

####################################################################################################
####################################################################################################

TagSchema.statics.getCached = (cb) ->
	mc = memjs.Client.create()
	mc.get 'tags', (err, val, key) ->
		if err # if cache error, query db
			console.warn('Cache error:', err)
			ret = []
		else if val is null
			console.warn('Cache query for tags returned null.')
			ret = []
		else
			ret = JSON.parse(val.toString())
		cb(null, ret)

TagSchema.statics.fetchAndCache = (cb) ->
	mc = memjs.Client.create()
	console.log('Flushing cached tags.')
	api.pushBlogTags(blog,
		(err, tags) =>
			throw err if err
			mc.set('tags', JSON.stringify(@recursify(tags)), cb)
	)

####################################################################################################
####################################################################################################

TagSchema.statics.findOrCreate = findOrCreate
TagSchema.statics.getLabel = getLabel
TagSchema.statics.getDescription = getDescription
TagSchema.statics.recursify = recursify
TagSchema.statics.checkFollowed = checkFollowed

module.exports = mongoose.model "Tag", TagSchema