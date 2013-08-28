
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
	
	put: (req, res) ->
		# Update tag.
		# All this does is accept a {checked:...} object and update the user
		# model accordingly.
		## console.log req.params.tag, req.user.tags
		if req.params.tag in req.user.tags
			console.log 'did follow'
			req.user.tags.splice(req.user.tags.indexOf(req.params.tag), 1)

		else
			console.log 'didn\'t follow'
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
		getPostsWithTags (seltags or req.user.tags), (err, tposts) ->
			res.end(JSON.stringify(tposts))

	template: (req, res) ->
		res.set({'Content-Type': 'text/plain'});
		res.sendfile(__dirname+'/views/tmpls/post.html');

Pages = {
	index:
		get: (req, res) ->
			if req.user
				console.log('logged:', req.user.name, req.user.tags)
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

	logout:
		get: (req, res) ->
			if not req.user then return res.redirect '/'
			req.logout()
			res.redirect('/')

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

	# Get post information. :id
	post:
		get: (req, res, id) ->
			return blog.posts {id:id}, ((err, data) -> res.write(JSON.stringify(data));)

	# Get tag. :tag
	tag:
		get: (req, res, tag) ->
			res.end('oi', tag)

	# Update user tags.
	update:
		post: (req, res) ->
			if not req.user then return res.redirect '/'

			chosen = req.body.tags.split(',')
			console.log(chosen)
			# Update tags and save
			req.user.tags = chosen
			req.user.save()

			# if chosen and not _.isEqual(chosen, req.user.tags)
				# api.sendNotification req.user.facebookId,
				#	"You are following the tags #{chosen.join(", ")}."
			
			# Update posts for user
			getPostsWithTags chosen, (err, posts) ->
				res.redirect 'back'

	# Deletes then user account.
	leave:
		get: (req, res) ->
			if not req.user then return res.redirect '/'
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
			User.remove {}, (err) ->
				res.write "users removed"
				if not --waiting then res.end(err)
			Post.remove {}, (err) ->
				res.write "\nposts removed"
				if not --waiting then res.end(err)
			Tag.remove {}, (err) ->
				res.write "\nposts removed"
				if not --waiting then res.end(err)
}

module.exports =
	Pages: Pages
	Posts: Posts
	Tags: Tags