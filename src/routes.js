
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
	// Require user to be me.
	if (!req.user || req.user.id != process.env.facebook_me)
		return res.redirect('/')
	next()
}

module.exports = function (app) {
	app.get('/', 		pages.Pages.index.get);
	app.post('/',		pages.Pages.index.post);
	app.post('/update',	pages.Pages.update.post);
	app.get('/logout',	pages.Pages.logout.get);
	app.get('/leave',	pages.Pages.leave.get);
	app.get('/session',	pages.Pages.session.get);
	app.get('/dropall',	pages.Pages.dropall.get);
	app.get('/post/:id',	pages.Pages.post.get);
	app.get('/tags/:tag', 	pages.Pages.tag.get);

	app.get('/tags/:tag', 	pages.Tag.get);
	app.post('/tags/:tag', 	pages.Tag.post);
	app.put('/tags/:tag', 	pages.Tag.put);
	app.delete('/tags/:tag', 	pages.Tag.delete);

	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
}