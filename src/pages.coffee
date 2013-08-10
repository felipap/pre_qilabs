
# pages.coffee

_	= require 'underscore'

api = require './api.js'
notify = require './notify.js'
pushPosts = require './pushPosts.js'
models = require './models/models.js'

User = models.User
Post = models.Post

blog_url = 'http://meavisa.tumblr.com'
blog = api.getBlog 'meavisa.tumblr.com'
tags = []
posts = []
tposts = []

api.pushBlogTags(blog,
	(err, _tags) ->
		throw err if err
		tags =  _tags
)

# Notice this is updating the global variable.
getTPostsWithTags = (tags, callback) ->
	api.getPostsWithTags(blog, tags, (err, _posts) ->
			posts = _posts; # Update global;
			callback?(err, _posts);
		)


# Notice this is updating the global variable.
getPost = (callback) ->
	pushPosts.pushNewPosts (err, data) ->
		posts = data

exports.Pages = {
	index:
		get: (req, res) ->
			if req.user
				console.log('logged:', req.user.name, req.user.tags)
				getPostsWithTags req.user.tags, (err, tposts) ->
					res.render 'panel', 
						user: req.user
						tags: tags
						posts: tposts
						blog_url: blog_url
						messages: [JSON.stringify(req.user), JSON.stringify(req.session)]
			else
				res.render('index')

	tags:
		get: (req, res) ->
			if req.user
				console.log('user selecting tags:', req.user, req.user.tags)
				res.render 'tags',
					user: req.user
					usertags: req.user.tags
					tags: tags
					blog_url: blog_url
					messages: []
			else
				res.redirect('/')

	logout:
		get: (req, res) ->
			if not req.user then return res.redirect '/'
			req.logout()
			res.redirect('/')

	session:
		get: (req, res) ->
			if not req.user or req.user.facebookId isnt process.env.facebook_me
				return res.redirect '/'
			User.find {}, (err, users) ->
				obj =
					ip: req.ip
					session: req.session
					users: users
				res.end(JSON.stringify(obj))

	notify:
		get: (req, res) ->
			if not req.user or req.user.facebookId isnt process.env.facebook_me
				return res.redirect '/'
			notify.notifyNewPosts()
			res.redirect('/')

	post:
		get: (req, res, id) ->
			return blog.posts {id:id}, ((err, data) -> res.write(JSON.stringify(data));)

	update:
		get: (req, res) ->
			if not req.user then return res.redirect '/'

			# If only one tag is checked, req.query.tag is a string
			if not req.query['tag'] or typeof req.query['tag'] is 'string'
				req.query['tag'] = [req.query['tag']]

			chosen = _.filter(req.query['tag'], (tag) -> tag?)

			if chosen and not _.isEqual(chosen, req.user.tags)
				# api.sendNotification req.user.facebookId,
				#	"You are following the tags #{chosen.join(", ")}."
			
			# Update tags and save
			req.user.tags = chosen
			req.user.save()

			# Update posts for user
			getPostsWithTags chosen, (err, posts) ->
				res.redirect 'back'

	leave:
		get: (req, res) ->
			if not req.user then return res.redirect '/'
			User.remove {id:req.user.id}, (err) ->
				throw err if err
				res.end('success')

	dropall:
		get: (req, res) ->
			# Require user to be me
			if req.user?.facebookId is process.env.facebook_me
				User.remove {}, (err) ->
					res.write "users removed"
					Post.remove {}, (err) ->
						res.write "\nposts removed"
						res.end err
			else
				res.redirect "/"
}
