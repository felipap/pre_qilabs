
# pages.coffee
# for meavisa.org, by @f03lipe

_	= require 'underscore'

api = require './api.js'

User = require './models/user.js'
Post = require './models/post.js'
Tag  = require './models/tag.js'

blog_url = 'http://meavisa.tumblr.com'
blog = api.getBlog 'meavisa.tumblr.com'
tags = []
posts = []

Tag.fetchAndCache() 		# Fetch from Tumblr server and cache

# Post.getWithTags() 		# 


Tags =
	get: (req, res) ->
		# Get all tags.
		res.end(JSON.stringify(Tag.checkFollowed(tags, req.user.tags)))

	post: (req, res) ->
		# Update checked tags.
		# Checks for a ?checked=[tags,] parameter.
		# Not sure if this is RESTful (who cares?). Certainly we're supposed to
		# use POST when sending data to /api/posts (and not /api/posts/:post)
		{checked} = req.body
		# throw "ERR" if not Tag.isValid(checked)
		req.user.tags = checked
		req.user.save()
		res.end()

	put: (req, res) ->
		# Update tag.
		# All this does is accept a {checked:...} object and update the user
		# model accordingly.
		console.log 'did follow'
		console.log 'didn\'t follow'
		if req.params.tag in req.user.tags
			req.user.tags.splice(req.user.tags.indexOf(req.params.tag), 1)
		else
			req.user.tags.push(req.params.tag)
		req.user.save()
		res.end()

Posts = {}
Pages = {}

module.exports =
	Pages: Pages
	Posts: Posts
	Tags: Tags
