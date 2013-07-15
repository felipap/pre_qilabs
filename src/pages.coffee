
_   	= require 'underscore'
api 	= require './apis.js'
request = require 'request'
User 	= require './models/user.js'

try
	env = require './env.js'
catch e
	env = {
		facebook: {
			app_id: process.env.facebook_app_id
			secret: process.env.facebook_secret
			canvas: process.env.facebook_canvas
		}
	}


blog_url = 'http://meavisa.tumblr.com' # 'http://meavisa.tumblr.com'
blog = api.getBlog("meavisa.tumblr.com");
topics = []; # 'physics', 'mathematics', 'chemistry', 'wizardry', 'programming', 'code'];
posts = []

# console.log 'blog:', blog

blog.posts (err, data) ->
	throw err if err;
	data.posts.forEach (post, i) ->
		post.tags.forEach (tag) ->
			if topics.indexOf(tag) == -1
				topics.push(tag);
				console.log('pushing found tag', tag)


getPostsWithTags = (tags, callback) ->
	blog.posts({ limit: -1 }, (err, data) ->
		# console.log('posts: ', data.posts)
		posts = []
		# console.log(data.posts[2].photos[0].alt_sizes)
		data.posts.forEach (post) ->
			int = _.intersection(post.tags, tags)
			if int[0]
				posts.push(post)
		callback?()
	)



exports.Pages = {
	index:
		get: (req, res) ->
			if req.user
				# req.user.lastUpdate = new Date(0)
				# req.user.save()
				req.session.messages = [JSON.stringify(req.user)]
				getPostsWithTags req.user.tags, ->
					res.render 'panel', 
						user: req.user
						topics: topics
						posts: posts
						blog_url: blog_url
						messages: [JSON.stringify(req.user), JSON.stringify(req.session)]
				return

			User.find {}, (err, users) ->
				res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
				res.write(JSON.stringify(users))
				res.end('\noi, '+req.ip+JSON.stringify(req.session)+"<form method='get' action='/auth/facebook'><input type='submit' name='oi' value='post'></form>")
			# res.render('index')

	logout:
		get: (req, res) ->
			req.logout()
			res.redirect('/')

	session:
		get: (req, res) ->
			User.find {}, (err, users) ->
				obj =
					ip: req.ip
					session: req.session
					users: users
				res.end(JSON.stringify(obj))

	update:
		get: (req, res) -> 
			if not req.user then return res.redirect '/'

			# if only one topic is checked, req.query.topic is a string
			if not req.query['topic'] or typeof req.query['topic'] is 'string'
				req.query['topic'] = [req.query['topic']]

			chosen = _.filter(req.query['topic'], (topic) -> topic?)

			if chosen and not _.isEqual(chosen, req.user.tags)
				api.sendNotification req.user.facebookId, "You are following the topics #{chosen.join(", ")}."
			
			req.user.tags = chosen;
			req.user.save()

			getPostsWithTags chosen, ->
			res.redirect 'back'

	dropall:
		get: (req, res) ->
			if req.user and req.user.facebookId is "100000366187376"
				User.remove {}, (err) ->
					res.write "collection removed"
					res.end err
			else
				res.end "Cannot GET /dropall" # Fake page.
}
