
# Set up a message middleware for the app.

module.exports = {
	# define a custom res.message() method which stores messages in the session
	setUp: (app) ->
		app.response.message = (msg) ->
			sess = @req.session; # reference `req.session` via the `this.req` reference
			# simply add the msg to an array for later
			sess.messages = sess.messages || [];
			sess.messages.push(msg);
			return @

	# expose the "messages" local variable when views are rendered
	message: (req, res, next) ->
		msgs = req.session.messages or []
		res.locals.messages = msgs # expose "messages" local variable
		res.locals.hasMessages = !! msgs.length # expose "hasMessages"
		###
		This is equivalent:
			res.locals({
				messages: msgs,
				hasMessages: !! msgs.length
			})
		###
		next()
		req.session.messages = [] # empty or "flush" the messages so they don't build up
}