
# TODO:
# - detect duplicate ids
# - test valid guides ids: /[a-z\-]{3,}/

_  = require 'underscore'
async = require 'async'
showdown = require 'showdown'
fs = require 'fs'
path = require 'path'

# Folder with markdown files
MD_LOCATION = 'text'

guideMap = require './text/map.js'
guideData = {}

####
## Process map.js to create routes

routeChildren = (children, parentPath) ->
	routes = {}
	for tagId, value of children
		do (tagId, value) ->
			routes['/'+tagId] = {
				name: 'guide_'+(parentPath+tagId).replace('/','_'),
				get: (req, res) ->
					console.log guideData[parentPath+tagId]
					res.render 'pages/guide_pages/page', {
						guideData: guideData,
						tagData: guideData[parentPath+tagId]
					}
				children: (value.children and routeChildren(value.children, parentPath+tagId+'/')) or {}
			}
	return routes

pages = {
	'/':
		name: 'guide_home'
		get: (req, res) ->
			res.render 'guide', {}
	children: routeChildren(guideMap, '/')
}

console.log 'pages:', pages

#### 
## Process map.js to open markdown files and save their html ing uideData

converter = new showdown.converter()

q = async.queue ((item, cb) ->
	console.log "<queue> processing item: #{item}"

	for citem, cval of item.children
		q.push _.extend({
			id: citem,
			parent: (item.parent or '/')+item.id+'/',
		}, cval)

	absPath = path.resolve(__dirname, MD_LOCATION, item.file)
	fs.readFile absPath, 'utf8', (err, text) ->
		if not text
			throw "WTF, file #{item.id} of path #{absPath} wasn't found"
		guideData[(item.parent or '/')+item.id] = _.extend({
			md: text,
			html: converter.makeHtml(text)
			path: '/guias'+(item.parent or '/')+item.id
			rootId: item.rootId or item.id
		}, item)
		cb()
), 3

q.drain = () ->
	console.log 'guideData', guideData

for id, val of guideMap
	q.push(_.extend({id:id, parent:'/', rootId:null}, val))

# console.log pages
module.exports = pages