
var passport = require('passport');
var pages 	= require('./pages.js');

module.exports = function (app) {
	app.get('/', pages.Pages.index.get);
	app.post('/', pages.Pages.index.get);
	app.get('/update', pages.Pages.update.get);
	app.get('/session', pages.Pages.session.get);
	app.get('/dropall', pages.Pages.dropall.get);
	app.get('/logout', pages.Pages.logout.get);

	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
}