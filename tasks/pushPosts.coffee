
# pushPosts.coffee
# This is a job. It pushes new posts to the database.

jobber = require('./jobber.js')((e) ->
	require('../src/models/post.js').fetchNew ->
		e.quit(true)
).start()