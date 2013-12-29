
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

	app.locals.urls = {};


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

	var router = require('./lib/router.js')(app);

	router({
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
		},

		'/auth/facebook/callback': {
			methods: {
				get: passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }),
			}
		},

		'/auth/facebook': {
			methods: { get: passport.authenticate('facebook') }
		}
	});

	/* Handle 404 */

	app.get('*', function (req, res) {
		res.status(404);
		
		if (req.accepts('html')) { // respond with html page
			res.render('pages/404', { url: req.url, user: req.user });
		} else if (req.accepts('json')) { // respond with json
			res.send({ error: 'Not found' });
			return;
		}
	});
}