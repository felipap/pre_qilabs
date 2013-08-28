
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
	if (!req.user || req.user.facebookId != process.env.facebook_me) {
		res.locals.message = ['what do you think you\'re doing?']
		return res.redirect('/');
	}
	next();
}

module.exports = function (app) {
	app.get('/', 		pages.Pages.index.get);
	app.post('/',		pages.Pages.index.post);
	app.get('/logout',	requireLogged, pages.Pages.logout.get);
	app.get('/leave',	requireLogged, pages.Pages.leave.get);
	
	app.get('/post/:id',	requireLogged, pages.Pages.post.get);
	app.get('/tags/:tag', 	requireLogged, pages.Pages.tag.get);

	app.get('/api/dropall',	requireMe, pages.Pages.dropall.get);
	app.get('/api/session', requireMe, pages.Pages.session.get);

	// Get all tags.
	app.get('/api/tags', requireLogged, pages.Tags.get);
	// Update tags with {checked:true|false}.
	app.put('/api/tags/:tag', requireLogged, pages.Tags.put);
	// Serve the template.
	app.get('/api/tags/template', requireLogged, pages.Tags.template);
	
	// Get all posts.
	app.get('/api/posts', requireLogged, pages.Posts.get);
	// Serve the template.
	app.get('/api/posts/template', requireLogged, pages.Posts.template);

	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
}