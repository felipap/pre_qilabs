

_  = require 'underscore'
async = require 'async'
showdown = require 'showdown'

fs = require 'fs'
path = require 'path'

map = require './map.js'

# detect duplicate
# test valid guides /[a-z\-]{3,}/
# check if file exists
tagData = {}

renderGuide = (req, res, tagPath) ->
	console.log tagPath, tagData[tagPath]
	res.render 'pages/guide_pages/page', {tagData: tagData[tagPath] }

routeChildren = (children, parentPath) ->
	routes = {}
	for tagId, value of children
		do (tagId, value) ->
			routes['/'+tagId] = {
				name: 'guide_'+tagId,
				get: (req, res) ->
					renderGuide(req, res, parentPath+tagId)
				children: (value.children and routeChildren(value.children, parentPath+tagId+'/')) or {}
			}
	return routes

# Process map.js to create routes
pages = {
	'/':
		name: 'guide_home'
		get: (req, res) ->
			res.render 'guide', {}
	children: routeChildren(map, '/')
}


console.log 'there!', pages

# Process map.js to open files
converter = new showdown.converter()
q = async.queue ((item, cb) ->
	console.log "Queue: processing item:", item

	for citem, cval of item.children
		q.push _.extend({id:citem}, cval, {parent:(item.parent or '/')+item.id+'/'})

	absPath = path.resolve(__dirname, item.file)
	fs.readFile absPath, 'utf8', (err, text) ->
		if not text
			throw "WTF, file #{absPath} wasn't found"
		tagData[(item.parent or '/')+item.id] = _.extend({}, item, {md: text, html: converter.makeHtml(text)})
		cb()
	
), 3

q.drain = () ->
	console.log 'tagData', tagData

for id, val of map
	q.push(_.extend({id: id, parent:'/'}, val))

# console.log pages
module.exports = pages