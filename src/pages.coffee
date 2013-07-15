
_   	= require 'underscore'
api 	= require './apis.js'
request = require 'request'

# db  	= require './db.js'
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

sendNotification = (user_id, template, callback) ->
	access_token = '521238787943358|irzJJKJ0-Z8-LiUshAfFazAirac'
	url = "https://graph.facebook.com/#{user_id}/notifications?access_token=#{access_token}&template=#{template}"
	request.post url,
		(error, response, body) ->
			console.log 'request with given token:', body, error, url
			if callback then callback(error, response, body)

getPostsWithTags = (tags, callback) ->
	blog.posts({ limit: -1 }, (err, data) ->
		# console.log('posts: ', data.posts)
		posts = []
		# console.log(data.posts[2].photos[0].alt_sizes)
		data.posts.forEach (post) ->
			int = _.intersection(post.tags, tags)
			if int[0]
				posts.push(post)
		callback posts
	)


User = require './app/models/user.js'

exports.Pages = {
	index:
		get: (req, res) ->
			# res.render('index')
			if req.user
				req.session.messages = [JSON.stringify(req.user)]
				getPostsWithTags req.user.tags, ->
					res.render 'panel', 
						user: req.user
						topics: topics
						posts: posts
						blog_url: blog_url
						messages: [JSON.stringify(req.user), JSON.stringify(req.session)]
				return
			if req.ip is '127.0.0.1'
				res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
				res.end("#{User.findOrCreate}s#{req.ip}<br><form method='get' action='/auth/facebook'><input type='submit' name='oi' value='post'></form>")
				return
			User.find {}, (err, users) ->
				res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
				res.write(JSON.stringify(users))
				res.end('\noi, '+req.ip+JSON.stringify(req.session)+"<form method='get' action='/auth/facebook'><input type='submit' name='oi' value='post'></form>")

		post: (req, res) ->
			res.redirect('/auth/facebook')
			# res.end("oi")


	logout:
		get: (req, res) ->
			req.logout()
			res.redirect('/')

	session:
		get: (req, res) ->
			User.find {}, (err, users) ->
				res.write(JSON.stringify(users))
				res.end('\noi, '+req.ip+JSON.stringify(req.session))

	update:
		get: (req, res) -> 
			if not req.user then return res.redirect '/'

			# if only one topic is checked, req.query.topic is a string
			if not req.query['topic'] or typeof req.query['topic'] is 'string'
				req.query['topic'] = [req.query['topic']]

			chosen = []
			for topic in req.query['topic']
				chosen.push(topic) if topic

			console.log 'chosen: ', chosen, req.query['topic']

			req.user.tags = chosen;
			req.user.save()

			sendNotification req.user.facebookId, 'You are now following the topics #{chosen} on MeAvisa.'

			getPostsWithTags chosen, ->
			res.redirect 'back'

	dropall:
		get: (req, res) ->
			User.remove {}, (err) ->
				res.write "collection removed"
				res.end err
}
