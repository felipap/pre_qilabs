
// app.js
// Copyright QILabs.org
// by @f03lipe

// This is the main server script.
// Set up everything.

// Import environment keys (if in development)
try { require('./config/env.js') } catch (e) {}

// Libraries
var _
,	express = require('express')				// *THE* nodejs framework
,	passport= require('passport') 				// Authentication framework
,	swig 	= require('swig')					// template language processor
,	expressWinston = require('express-winston')
,	winston = require('winston')
// Utils
,	pathLib = require('path')
,	fsLib 	= require('fs')
,	_ 		= require('underscore')
// Configuration
,	mongoose = require('./config/mongoose.js') // Set-up mongoose
;

var app = module.exports = express();
require('./config/app_config.js')(app);
require('./config/passport.js')();

/*
** Template engines and static files. **/
app.engine('html', swig.renderFile);
app.set('view engine', 'html'); 			// make '.html' the default
app.set('views', app.config.viewsRoot); 	// set views for error and 404 pages
app.set('view cache', false);
app.use(require('connect').compress());
app.use(express.static(pathLib.join(app.config.staticRoot, 'robots.txt')));
app.use(express.static(pathLib.join(app.config.staticRoot, 'people.txt')));
app.use(express.favicon(pathLib.join(app.config.staticRoot, 'favicon.ico')));

if (app.get('env') === 'development') {
	swig.setDefaults({ cache: false });
}

/******************************************************************************/
/* BEGINNING of a DO_NO_TOUCH_ZONE ********************************************/
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(require('express-validator')());
app.use(app.config.staticUrl, express.static(app.config.staticRoot));
app.use(express.cookieParser());
app.use(express.session({
	secret: process.env.SESSION_SECRET || 'mysecret',
	maxAge: new Date(Date.now() + 3600000),
	store: 	new (require('connect-mongo')(express))({
		mongoose_connection: mongoose.connection
	})
}));
app.use(express.csrf());
/** END of a DO_NO_TOUCH_ZONE -----------------------------------------------**/
/**--------------------------------------------------------------------------**/


/******************************************************************************/
/** BEGINNING of a SHOULD_NOT_TOUCH_ZONE **************************************/
app.use(function(req, res, next){
	res.locals.token = req.session._csrf; // Add csrf token to views.
	next();
});
app.use(require('connect-flash')());
app.use(passport.initialize());
app.use(passport.session());
/** END of a SHOULD_NOT_TOUCH_ZONE ------------------------------------------**/
/**--------------------------------------------------------------------------**/

app.use(require('./config/middlewares/flash_messages.js'));
app.use(require('./config/middlewares/local_user.js'));

app.use(function(req, res, next) {
	res.endJson = function (data) {
		res.end(JSON.stringify(data));
	};

	res.render404 = function () {
		res.status(404);
		if (req.accepts('html')) { // respond with html page;
			res.render('pages/404', { url: req.url, user: req.user });
		} else if (req.accepts('json')) { // respond with json;
			res.send({ error: true, name: 'Notfound' });
		}
	};

	req.paramToObjectId = function (param) {
		try {
			return new mongoose.Types.ObjectId.fromString(req.params[param])
		} catch (e) {
			res.status(400).endJson({error:true, name:'InvalidId'})
			return false;
		}
	};

	req.logMe = function () {
		console.log.apply(console, ["<"+req.user.username+">:"].concat([].slice.call(arguments)));
	};

	next();
});


/******************************************************************************/
/** Logging (must be after app.use(app.router)) *******************************/
// app.use(function (req, res, next) {
// 	if (req.user) {
// 		console.log('<'+req.user.username+'> requested '+req.path)
// 	}
// 	next();
// });
app.use(expressWinston.logger({
	transports: [
		new winston.transports.Console({
			json: true,
			colorize: true
		})
	],
	meta: false,
	msg: "<{{(req.user && req.user.username) || 'anonymous' + '@' + req.connection.remoteAddress}}>: HTTP {{req.method}} {{req.url}}"
}));
/***************************** Don't remove. **********************************/
app.use(app.router); 
/******************************************************************************/
/** Error logging (must be after app.use(app.router)) *************************/
app.use(expressWinston.errorLogger({
	transports: [
		new winston.transports.Console({
			json: true,
			colorize: true
		}),
	],
}));
/**--------------------------------------------------------------------------**/


// app.use(express.logger());

app.locals({
	poc: 'poc',
	tags: {},
	errors: {},
	version_label: "alpha",
	version_str: 'versão 0.5, alpha',
	getPageUrl: function (name, args) { // (name, args... to fill pageurl if known)
		if (typeof app.locals.urls[name] !== 'undefined') {
			/* Fill in arguments to url passed in arguments. */
			var url = app.locals.urls[name],
				regex = /:[\w_]+/g;
			/* This doesn't account for optional arguments! TODO */
			if ((url.match(regex) || []).length !== _.size(args))
				throw "Wrong number of keys to getPageUrl.";

			if (args) {
				console.log(args)
				var a = url.replace(regex, function (occ) {
					var argName = occ.slice(1,occ.length);
					if (!(argName in args))
						throw "Invalid argument "+argName+" to url '"+url+"'' getPageUrl. ";
					return args[occ.slice(1,occ.length)];
				});
				// console.log (a)
				return a
			} else {
				return url;
			}

		} else {
			if (app.get('env') !== 'production') {
				throw "Page named "+name+" was referenced but doesn't exist.";
			}
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
				if (!fsLib.existsSync(absPath) && !fsLib.existsSync(absPath+'.js')) {
					if (app.get('env') !== 'production') {
						throw "Required css/js file "+absPath+" not found.";
					} else {
						console.log("Required css/js file "+absPath+" not found.");
					}
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
		semantic_version: 'α1',
		env: app.get('env')
	},
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
	res.render('pages/404');
});

/******************************************************************************/
/* BEGINNING of a DO_NO_TOUCH_ZONE ********************************************/
var server = require('http')
		.createServer(app)
		.listen(process.env.PORT || 3000, function () {
	console.log('Server on port %d in %s mode', server.address().port, app.settings.env);
});
/** END of a DO_NO_TOUCH_ZONE -----------------------------------------------**/
/**--------------------------------------------------------------------------**/