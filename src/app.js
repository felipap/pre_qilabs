
// apps.js
// for meavisa.org, by @f03lipe

// This is the main script.
// Set up everything.

// Import environment keys (if in development)
try { require('./env.js') } catch (e) {}

// Libraries
var flash 	= require('connect-flash'),
	passport= require('passport'),
	connect = require('connect'),
	express = require('express'),
	swig 	= require('swig'),
// Utils
	pathLib = require('path'),
	fsLib 	= require('fs')
;

var mongoose = require('./config/mongoose.js');
var app = module.exports = express();
require('./config/passport.js')();
require('./config/app_config.js')(app);

app.engine('html', swig.renderFile)
app.set('view engine', 'html'); // make '.html' the default
app.set('views', app.config.viewsRoot); // set views for error and 404 pages
app.set('view options', {layout: false}); // disable layout
app.set('view cache', false);
app.use(connect.compress());
app.use(express.static(pathLib.join(app.config.staticRoot, 'robots.txt')));
app.use(express.static(pathLib.join(app.config.staticRoot, 'people.txt')));
app.use(express.favicon(pathLib.join(app.config.staticRoot, 'favicon.ico')));

app.use(express.favicon(__dirname + '/static/favicon.ico'))
// app.use(express.logger());
app.use(express.methodOverride()); // support _method (PUT in forms etc)
app.use(express.bodyParser()); // parse request bodies (req.body)
app.use(require('express-validator')());
app.use(app.config.staticUrl, express.static(app.config.staticRoot)); // serve static files
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
app.use(require('./config/middlewares/flash_messages.js'));
app.use(require('./config/middlewares/local_user.js'));
app.use(app.router);
app.use(express.logger());

if (app.get('env') === 'development') {
	swig.setDefaults({ cache: false });
}

////////////////////////////////////////////////////////////////////////

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
	getMediaUrl: function (mediaType) {
		var relPath = pathLib.join.apply(null, arguments);
		// Check file existence for these.
		switch (mediaType) {
			case "css":
			case "js": {
				var absPath = pathLib.join(app.config.staticRoot, relPath);
				if (!fsLib.existsSync(absPath)) {
					throw "Required css/js file "+absPath+" not found.";
				}
			}
		}
		return pathLib.join(app.config.staticUrl, relPath);
	},
	_: require('underscore'),
	urls: {
		'twitter': '#',
		'facebook': '#'
	},
	app: {
		semantic_version: 'α1'
	}
});

if (app.get('env') === 'production') {
	app.use(require('./config/middlewares/handle_500.js'));
} else {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.locals.pretty = false;
}

// Pass pages through router.js
require('./lib/router.js')(app)(require('./pages.js'));

// Handle 404
app.get('*', function (req, res) {
	res.redirect('/404');
});


var server = require('http')
		.createServer(app)
		.listen(process.env.PORT || 3000, function () {
	console.log('Server on port %d in %s mode', server.address().port, app.settings.env);
});