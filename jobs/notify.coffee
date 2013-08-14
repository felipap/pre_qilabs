
# notify.coffee
# This is a job. It botifies users of new posts with the tags they follow.

`api = require('../src/api.js');`

if module is require.main
	# If being executed directly...
	# > load keys
	try require('../src/env.js') catch e
	# > open database
	mongoose = require 'mongoose'
	mongoUri = process.env.MONGOLAB_URI or process.env.MONGOHQ_URL or 'mongodb://localhost/madb'
	mongoose.connect(mongoUri)
	# ready to go
	api.notifyNewPosts ->
		# Close database at the end.
		# Otherwise, the script won't close.
		mongoose.connection.close()
else
	throw "This module is supposed to be executed as a job."