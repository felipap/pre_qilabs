
// routes.js
// for meavisa.org, by @f03lipe

var passport = require('passport');
var pages = require('./pages.js');

function requireLogged (req, res, next) {
	if (!req.user)
		return res.redirect('/')
	next()
}

function requireMe (req, res, next) {
	// Require user to be me. :D
	if (!req.user || req.user.id != process.env.facebook_me)
		return res.redirect('/');
	next();
}

module.exports = function (app) {
	app.get('/', 		pages.Pages.index.get);
	app.post('/',		pages.Pages.index.post);
	app.get('/logout',	pages.Pages.logout.get);
	app.get('/leave',	pages.Pages.leave.get);
	app.get('/session',	pages.Pages.session.get);
	app.get('/dropall',	pages.Pages.dropall.get);
	app.get('/post/:id',	pages.Pages.post.get);
	app.get('/tags/:tag', 	pages.Pages.tag.get);

	app.get('/api/tags', 	pages.Tags.get);
//	app.post('/api/tags', 	pages.Tags.post);		// Users are not supposed to create tags.
	app.put('/api/tags/:tag', 	pages.Tags.put);
//	app.delete('/api/tags/:tag',pages.Tags.delete); // Users are not supposed to delete tags.

	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
}