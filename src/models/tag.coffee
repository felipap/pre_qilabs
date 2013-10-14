
# models/tag.coffee
# for meavisa.org, by @f03lipe

# Tag model.

mongoose = require 'mongoose'
crypto = require 'crypto'
_ = require 'underscore'

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

# Taken from https://github.com/drudge/mongoose-findorcreate
findOrCreate = (conditions, doc, options, callback) ->
	if arguments.length < 4
		if typeof options is 'function' # Scenario: findOrCreate(conditions, doc, callback)
			callback = options
			options = {}
		else if typeof doc is 'function' # Scenario: findOrCreate(conditions, callback);
			callback = doc
			doc = {}
			options = {}
	
	self = this;
	@findOne conditions, (err, result) ->
		if err or result
			if options and options.upsert and not err
				self.update(conditions, doc, (err, count) ->
					self.findOne(conditions, (err, result) ->
						callback(err, result, false)
					)
				)
			else
				callback(err, result, false)
		else
			conditions = _.extend(conditions, doc)
			obj = new self(conditions)
			obj.save (err) ->
				callback(err, obj, true)

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

# Turn a horizontal list of tags into a recursive structure with label and children.
# TODO! this implementation looks expensive
# TODO! Rename this to buildTag, or smthing.
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

# Takes as input
# rtags: a recursive tags object
# followed: a plain list of tags the user follows.
# Returns a recursive tags object with attributes checked in each tag
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

TagSchema.statics.findOrCreate = findOrCreate
TagSchema.statics.getLabel = getLabel
TagSchema.statics.getDescription = getDescription
TagSchema.statics.recursify = recursify
TagSchema.statics.checkFollowed = checkFollowed

module.exports = mongoose.model "Tag", TagSchema