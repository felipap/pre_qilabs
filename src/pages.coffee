
# pages.coffee

_	= require 'underscore'

api = require './api.js'

User = require './models/user.js'
Post = require './models/post.js'

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

exports.Pages = {
	index:
		get: (req, res) ->
			if req.user
				console.log('logged:', req.user.name, req.user.tags)
				req.user.lastUpdate = new Date()
				req.user.save()
				getPostsWithTags req.user.tags, (err, tposts) ->
					res.render 'panel', 
						user: req.user
						tags: tags
						posts: tposts
						blog_url: blog_url
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
			if req.user?.facebookId is process.env.facebook_me
				User.remove {}, (err) ->
					res.write "users removed"
					Post.remove {}, (err) ->
						res.write "\nposts removed"
						res.end err
			else
				res.redirect "/"
}
