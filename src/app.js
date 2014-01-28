// apps.js
// for meavisa.org, by @f03lipe

// This is the main script.
// Set up everything.

// Attempt to import environment keys (if on production)
try { require('./env.js') } catch (e) {}

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/madb');

var flash = require('connect-flash'); 
var passport = require('passport');
var connect = require('connect');

var express = require('express'),
	app = module.exports = express();

require('./config/passport.js')();

app.set('view engine', 'html'); // make '.html' the default
app.set('views', __dirname + '/views'); // set views for error and 404 pages
app.set('view options', {layout: false}); // disable layout
app.set('view cache', true);
app.engine('html', require('ejs-locals'))

app.use(connect.compress());

app.use(express.static(__dirname + '/static/robots.txt'))
app.use(express.static(__dirname + '/static/people.txt'))
app.use(express.favicon(__dirname + '/static/favicon.ico'))

if (app.get('env') === 'production') {
	app.use(express.logger());
}

app.use(express.methodOverride()); // support _method (PUT in forms etc)
app.use(express.bodyParser()); // parse request bodies (req.body)
app.use(require('express-validator')());
app.use('/static', express.static(__dirname + '/static')); // serve static files
app.use(express.cookieParser()); // support cookies
app.use(express.session({
	secret: process.env.SESSION_SECRET || 'mysecret',
	maxAge: new Date(Date.now() + 3600000),
	store: 	new (require('connect-mongo')(express))({ mongoose_connection: mongoose.connection })
}));
app.use(express.csrf());
app.use(function(req, res, next){ res.locals.token = req.session._csrf; next(); });
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
	res.locals.messages = req.flash();
	next();
});

if (app.get('env') === 'development') {
	app.use(express.logger());
}

app.use(app.router);

////////////////////////////////////////////////////////////////////////

var path = require('path');
app.locals({
	tags: {},
	errors: {},
	version_label: "alpha",
	version_str: 'versão 0.5, alpha',
	getPageUrl: function (name) { // (name, args... to fill pageurl if known)
		if (typeof app.locals.urls[name] !== 'undefined') {
			/* Fill in arguments to url passed in arguments. */
			var args = Array.prototype.slice.call(arguments, 1),
				url = app.locals.urls[name],
				regex = /:[\w_]+/g;
			// This doesn't account for optional arguments! TODO
			if ((url.match(regex) || []).length !== args.length)
				throw "Wrong number of arguments to getPageUrl.";
			return url.replace(regex, function (occ) {
				return args.pop();
			});
		} else {
			// if (typeof app.locals.urls[name] === 'undefined')
			// 	throw "Page named "+name+" was referenced but doesn't exist."
			return "#";
		}
	},
	getMediaUrl: function () {
		return path.join.apply(null, ['/static/'].concat([].splice.call(arguments,0)));
	},
	urls: {
		'twitter': '#',
		'facebook': '#'
	},
	app: {
		semantic_version: 'α1'
	}
});

// Error-handling middleware [...] must be defined with an arity of 4
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.render('pages/500', {
		user: req.user
	})
});

// Pass pages through router.js
require('./lib/router.js')(app)(require('./pages.js'));

// Handle 404
app.get('*', function (req, res) {
	res.status(404);
	
	if (req.accepts('html')) { // respond with html page
		res.status(404).render('pages/404', { url: req.url, user: req.user });
	} else if (req.accepts('json')) { // respond with json
		res.status(404).send({ error: 'Not found' });
		return;
	}
});


if (app.get('env') === 'development') {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.locals.pretty = false;
}

var server = require('http')
		.createServer(app)
		.listen(process.env.PORT || 3000, function () {
	console.log('Server on port %d in %s mode', server.address().port, app.settings.env);
});