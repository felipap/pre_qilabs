
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

	app.locals.getPageUrl = function (name) {
		if (typeof app.locals.urls[name] === 'undefined')
			throw "Page named "+name+" not found."
		return app.locals.urls[name];
	}

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

		function routePath (path, name, mToFunc) {
			// TODO: prevent overriding urls with different paths.
			app.locals.urls[name] = path;
			
			// Use app[get/post/put/...] to route methods in mToFunc.
			for (var method in mToFunc)
			if (mToFunc.hasOwnProperty(method)) {
				var func = mToFunc[method];
				// If obj[method] is a list of functions to call, use apply.
				if (func instanceof Array) {
					app[method].apply(app, [path].concat(func));
				} else {
					app[method](path, func);
				}
			}
		}

		var joinPath = require('path').join.bind(require('path'));

		function routeChildren(parentPath, childs) {
			if (!childs) return {};

			console.log('oooi', childs)

			for (var relpath in childs)
			if (childs.hasOwnProperty(relpath)) {
				var abspath = joinPath(parentPath, relpath);
				var name = childs[relpath].name || abspath.replace('/','_');
				routePath(abspath, name, childs[relpath].methods);
				routeChildren(abspath, childs[relpath].children);
			}
		}

		for (var path in object) if (object.hasOwnProperty(path)) {
			if (object[path].methods)
				routePath(path, object[path].name, object[path].methods);
			routeChildren(path, object[path].children);
		}

	}

	function staticPage (template, name) {
		return {
			name: name,
			methods: {
				get: function (req, res) {
					res.render(template, {
						user: req.user,
					})
				}
			}
		}
	}
		
	routePages2({
		'/': {
			name: 'index',
			methods: pages.Pages.index
		},
		'/logout': {
			name: 'logout',
			methods: {
				get: pages.Pages.logout
			}
		},
		'/leave': {
			name: 'leave',
			methods: {
				get: pages.Pages.leave_get
			}
		},
		'/painel': 	staticPage('pages/panel', 'panel'),
		'/sobre': 	staticPage('pages/about', 'about'),
		'/equipe': 	staticPage('pages/team', 'team'),

		'/api': {
			children: {
				'dropall': {
					methods: { get: [requireMe, pages.Pages.dropall.get]}
				},
				'session': {
					methods: { get: [requireMe, pages.Pages.session.get]}
				},
				'tags': {
					methods: {
						// Get all tags.
						get: [requireLogged, pages.Tags.get],
						// Update tags with ?checked=[tags,]
						post: [requireLogged, pages.Tags.post],
					},
					children: {
						':tag': {
							methods: {
								// Update tags with {checked:true|false}.
								put: [requireLogged, pages.Tags.put],
							}
						},
						'template': {
							methods: {
								// Serve the template.
								get: [requireLogged, pages.Tags.template],
							}
						}
					}
				},
				'posts': {
					methods: {
						// Get all posts.
						get: [requireLogged, pages.Posts.get],
					
					},
					children: {
						'template': {
							methods: {
								// Serve the template.
								get: [requireLogged, pages.Posts.template],
							}
						}
					}
				}
			}
		}
	})

	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));
}