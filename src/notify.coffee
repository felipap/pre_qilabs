
# notify.coffee

_ 	= require 'underscore'
api = require './apis.js'
mongoose = require 'mongoose'

User = require './models/user.js'

blog_url = 'http://meavisa.tumblr.com'
blog = api.getBlog "meavisa.tumblr.com"

mongoUri = process.env.MONGOLAB_URI or process.env.MONGOHQ_URL or 'mongodb://localhost/madb'

mongoose.connect(mongoUri)

onGetPosts = (posts, callback) ->
	User.find {}, (err, users) ->
		notSaved = users.length
		
		for user in users
			tags = _.union.apply null,
						_.pluck \
							_.filter(posts, (post) ->
								return new Date(post.date) > new Date(user.lastUpdate);
						), 'tags'

			if tags.length
				api.sendNotification user.facebookId, "We have updated on some of the tags you are following: "+tags.join(', ')
			
			user.lastUpdate = new Date()
			user.save (e) ->
				notSaved -= 1
				if notSaved == 0
					callback?()

blog.posts (err, data) -> 
	if err then throw err
	onGetPosts data.posts, ->
		mongoose.connection.close()

# module.exports = {
# 	notify: (req, res) ->
# 		onGetPosts*
# 		res.end('')
# }