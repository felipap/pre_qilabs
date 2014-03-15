
# consistify.coffee

async = require 'async'
_ = require 'underscore'

jobber = require('./jobber.js')((e) ->
	mongoose = require 'mongoose'

	Notification = mongoose.model 'Notification'
	Resource = mongoose.model 'Resource'

	Activity = Resource.model 'Activity'
	Post = Resource.model 'Post'
	Group = Resource.model 'Group'
	User = Resource.model 'User'

	testCount = 0

	tests = [
		(next) ->
			Activity.find({}).populate('actor object target').exec (err, docs) =>
				if err then console.warn err
				incon = _.filter(docs,(i)->not i.actor or not i.object or not i.object)
				console.log('Activities with obsolete actor/object/target found:', incon.length)
				for doc in docs
					doc.remove(() -> )
				next(err)
		,(next) ->
			Activity.find({$not:{group:null}}).populate('group').exec (err, docs) =>
				if err then console.warn err
				console.log('Activities with obsolete group found:', docs.length)
				next(err)
		
		,(next) ->
			Post.find({}).populate('author').exec (err, docs) =>
				if err then console.warn err
				incon = _.filter(docs,(i)->not i.author)
				console.log('Posts with obsolete author found:', docs.length)
				next(err)
		
		,(next) ->
			Post.find({$not:{group:null}}).populate('group').exec (err, docs) =>
				if err then console.warn err
				incon = _.filter(docs,(i)->not i.group)
				console.log('Posts with obsolete group found:', docs.length)
				next(err)

		,(next) ->
			Notification.find({}).populate('recipient agent').exec (err, docs) =>
				if err then console.warn err
				console.log('Posts with obsolete group found:', docs.length)
				next(err)
		]

	wrapTest = (test) ->
		() ->
			console.log("Starting test #{testCount++}.")
			test.apply(this,arguments)

	async.series _.map(tests, (i)->wrapTest(i)),
		(err, results) ->
			console.log('err', err, 'results', results)
			e.quit()

).start()
