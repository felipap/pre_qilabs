
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
tposts = []

api.pushBlogTags(blog,
	(err, _tags) ->
		throw err if err
		tags =  _tags
		for tag, meta of _tags
			console.log('pushing found tag: #' + tag, _.keys(meta.children))
)

# Notice this is updating the global variable.
getPostsWithTags = (tags, callback) ->
	api.getPostsWithTags(blog, tags, (err, _posts) ->
			posts = _posts; # Update global;
			callback?(err, _posts);
		)


Tags =
	get: (req, res) ->
		# Get all tags.
		console.log('getting', JSON.stringify(Tag.checkFollowed(tags, req.user.tags)))
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

	template: (req, res) ->
		res.set({'Content-Type': 'text/plain'});
		res.sendfile(__dirname+'/views/tmpls/tag.html');

Posts =
	get: (req, res) ->
		# Get all posts.
		console.log(req.query.tags)
		if req.query.tags
			seltags = req.query.tags.split(',')
		else
			seltags = req.user.tags
		getPostsWithTags seltags, (err, tposts) ->
			console.log('returning', tposts)
			res.end(JSON.stringify(tposts))

	template: (req, res) ->
		res.set({'Content-Type': 'text/plain'});
		res.sendfile(__dirname+'/views/tmpls/post.html');

Pages = {
	index:
		get: (req, res) ->
			if req.user
				# console.log('logged:', req.user.name, req.user.tags)
				req.user.lastUpdate = new Date()
				req.user.save()
				getPostsWithTags req.user.tags, (err, tposts) ->
					res.render 'panel',
						user: req.user
						tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
						posts: tposts
						blog_url: blog_url
						# token: req.session._csrf
						messages: [JSON.stringify(req.user), JSON.stringify(req.session)]
			else
				User.find()
					.sort({'_id': 'descending'})
					.limit(10)
					.find((err, data) ->
						res.render 'index',
							latestSignIns: data
							messages: [JSON.stringify(req.session)]
						)

		post: (req, res) ->
			# Redirect from frame inside Facebook?
			res.end('<html><head></head><body><script type="text/javascript">'+
					'window.top.location="http://meavisa.herokuapp.com";</script>'+
					'</body></html>')

	# hm... logout?
	logout:
		get: (req, res) ->
			if not req.user then return res.redirect '/'
			req.logout()
			res.redirect('/')

	# Deletes then user account.
	leave:
		get: (req, res) ->
			req.user.remove (err, data) ->
				if err then throw err
				req.logout()
				res.redirect('/')

	# This is a bomb.
	dropall:
		get: (req, res) ->
			# Require user to be me
			waiting = 3
			console.log('you there')
			User.remove {id:'a'}, (err) ->
				res.write "users removed"
				if not --waiting then res.end(err)
			Post.remove {id:'a'}, (err) ->
				res.write "\nposts removed"
				if not --waiting then res.end(err)
			Tag.remove {id:'a'}, (err) ->
				res.write "\nposts removed"
				if not --waiting then res.end(err)

	# This is also a bomb. 
	# Returns session and db information.
	session:
		get: (req, res) ->
			if not req.user or req.user.facebookId isnt process.env.facebook_me
				return res.redirect '/'
			User.find {}, (err, users) ->
				Post.find {}, (err, posts) ->
					obj =
						ip: req.ip
						session: req.session
						users: users
						posts: posts
					res.end(JSON.stringify(obj))
}

module.exports =
	Pages: Pages
	Posts: Posts
	Tags: Tags
