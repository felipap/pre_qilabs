
var passport = require('passport');
var pages = require('./pages.js');

function requireLogged (req, res, next) {
	if (!req.user)
		return res.redirect('/')
	next()
}

function requireMe (req, res, next) {
	// Require user to be me.
	if (!req.user || req.user.id != process.env.facebook_me)
		return res.redirect('/')
	next()
}

module.exports = function (app) {
	app.get('/', 		pages.Pages.index.get);
	app.post('/',		pages.Pages.index.post);
	app.get('/update',	pages.Pages.update.get);
	app.get('/logout',	pages.Pages.logout.get);
	app.get('/leave',	pages.Pages.leave.get);
	app.get('/tags', 	pages.Pages.tags.get);
	app.get('/session',	pages.Pages.session.get);
	app.get('/dropall',	pages.Pages.dropall.get);
	app.get('/post/:id',pages.Pages.post.get);

	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
}