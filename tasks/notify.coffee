
# notify.coffee
# This is a job. It notifies users of new posts with the tags they follow.

jobber = require('./jobber.js')((e) ->
	require('../src/api.js').notifyNewPosts ->
		e.quit(true)
).start()