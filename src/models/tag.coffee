
# Post model.
# Reference: https://github.com/madhums/node-express-mongoose-demo
# Removed from example:
# - validation of removed fields,

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
			for key in doc
				conditions[key] = doc[key]
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

# Turn a horizontal list of tags into a recursive structure with label and children.
# TODO! this implementation looks expensive
recursify = (tags) ->
	# console.log('tags', tags)
	tagsObj = {hashtag:'', label: null, children: {}}
	for hashtag in tags
		tagList = hashtag.split(':')
		parent = tagsObj
		while tagList.length
			hashtag = tagList.shift()
			# if parent.children[hashtag] # tag already there
			# 	if tagList.length is 0 # tag is repeated
			# 		break
			# 	parent = parent.children[hashtag]
			# else
			parent = parent.children[hashtag] ?= {
				hashtag:parent.hashtag+':'+hashtag, label:getLabel(hashtag), children:{}}
			# console.log('parent is now', '\n\t parent', parent, '\n\t obj', '\n\t', tagsObj)
	
	for hashtag, obj of tagsObj.children
		obj.children['estagio'] = {"hashtag":hashtag+":estagio","label":"Estágio","children":{},"checked":false}
	
	return tagsObj.children

# Takes as input
# rtags: a recursive tags object
# followed: a plain list of tags the user follows.
# Returns a recursive tags object with attributes checked in each tag
checkFollowed = (_rtags, followed) ->
	rtags = _.clone(_rtags)
	for key, rtag of rtags
		rtag.checked = if (key in followed) then true else false
		for ckey, ctag of rtag.children
			ctag.checked = if ('#{key}:#{ckey}' in followed) then true else false
	return rtags


getLabel = (hashtag) ->
	return transTable[hashtag.toLowerCase()] or hashtag.toCamel()

TagSchema.statics.findOrCreate = findOrCreate
TagSchema.statics.getLabel = getLabel
TagSchema.statics.recursify = recursify
TagSchema.statics.checkFollowed = checkFollowed

module.exports = mongoose.model "Tag", TagSchema