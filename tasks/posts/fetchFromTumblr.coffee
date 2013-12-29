
# posts/fetchFromTumblr.coffee
# Wrapper around Post.fetchNew.

jobber = require('../jobber.js')((e) ->
	console.log('Starting to fetch all posts.')
	Post = require('../../src/models/post.js')
	Post.fetchNew (err, results) ->
		console.log("Posts refetched and maintaned: #{results.length}")
		Post.flushCache (err2) ->
			e.quit(err or err2)
).start()