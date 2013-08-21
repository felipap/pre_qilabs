
// config/messages.js
// for meavisa.org, @f03lipe

function setUp (app) {
	return app.response.message = function(msg) {
		var sess;
		sess = this.req.session;
		sess.messages = sess.messages || [];
		sess.messages.push(msg);
		return this;
	};
}

function message (req, res, next) {
	var msgs;
	msgs = req.session.messages || [];
	res.locals.messages = msgs;
	res.locals.hasMessages = !!msgs.length;
	/*
		This is equivalent:
			res.locals({
				messages: msgs,
				hasMessages: !! msgs.length
			})
	*/
	next();
	return req.session.messages = [];
}

module.exports.setUp = setUp
module.exports.message = message