
# posts/dropall.coffee

jobber = require('../jobber.js')((e) ->
	console.log("About to drop all posts.")
	e.checkContinue ->
		Post = require('../../src/models/post.js')
		Post.remove {}, (err, count) ->
			console.log("Count affected: #{count}.")
			Post.flushCache (err2) ->
				e.quit(err or err2)
).start()