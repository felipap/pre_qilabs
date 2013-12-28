
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
		return res.redirect('/about');
	}
	next();
}

module.exports = function (app) {

	/*
	** Route ONE path.
	** Usage: routePage('get', '/', funcs, ...)
	*/
	routePage = function (method, path) {
		app[method].apply(app, [].splice.call(arguments,1))
	}

	/*
	** Route an object with many pages.
	** Usage: routePages('/', {
	**     get: [requireSmthg, function (req, res) { ... }],
	**     post: function (req, res) { ... }
	** })
	*/
	routePages = function (path, object) {
		for (var method in object) if (object.hasOwnProperty(method)) {
			// If object[<method>] is a list of functions, call using apply.
			if (object[method] instanceof Array) {
				app[method].apply(app, [path].concat(object[method]));
			} else {
				app[method](path, object[method]);
			}
		}
	}
	
	app.locals.urls = {};
	routePages2 = function (object) {

		for (var path in object) if (object.hasOwnProperty(path)) {
			var pathRoute = object[path];
			
			// TODO: prevent overriding urls with different paths.
			app.locals.urls[pathRoute.name] = path;

			// Use app[get/post/put/...] to route methods in pathRoute.methods.
			for (var method in pathRoute.methods)
			if (pathRoute.methods.hasOwnProperty(method)) {
				var func = pathRoute.methods[method];
				// If obj[method] is a list of functions to call, use apply.
				if (func instanceof Array) {
					app[method].apply(app, [path].concat(func));
				} else {
					app[method](path, func);
				}
			}
		}

	}
	
	routePages('/', pages.Pages.index);

	routePage('get', '/logout', requireLogged, pages.Pages.logout_get);
	routePage('get', '/leave', requireLogged, pages.Pages.leave_get);
	
	// routePages2({
	// 	'/': {
	// 		name: 'index',
	// 		methods: {
	// 			get: function (req, res) {
	// 				res.end('oi!')
	// 			},
	// 			post: [requireLogged, function (req, res) {
	// 				res.end('welcome.');
	// 			}],
	// 		}
	// 	}
	// })

	app.get('/panel', 	pages.Pages.panel.get);
	app.post('/panel', 	pages.Pages.panel.post);
	app.get('/about', 	pages.Pages.about_get);
	app.get('/us', 		pages.Pages.us_get);

	app.get('/api/dropall',	requireMe, pages.Pages.dropall.get);
	app.get('/api/session', requireMe, pages.Pages.session.get);

	// Get all tags.
	app.get('/api/tags', requireLogged, pages.Tags.get);
	// Update tags with ?checked=[tags,]
	app.post('/api/tags', requireLogged, pages.Tags.post);
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