// server.js
// Copyright QILabs.org
// by @f03lipe

// This is the main server script.
// Set up everything.

// Import environment keys (if in development)
try { require('./config/env.js') } catch (e) {}

// Libraries
var _
,	express = require('express')				// framework
,	helmet 	= require('helmet')					// middlewares with security headers
, 	bParser	= require('body-parser') 			// 
,	passport= require('passport') 				// authentication framework
,	swig 	= require('swig')					// template language processor
,	expressWinston = require('express-winston') // Logging
,	winston = require('winston')
// Utils
,	pathLib = require('path')
// Configuration
var app = module.exports = express()
,	mongoose = require('./config/mongoose.js') 	// Set-up mongoose
,	kueQueue = require('./config/kue.js') 		// Set-up kue
;

require('./config/app_config.js')(app);
require('./config/passport.js')(app);

/*
** Template engines and static files. **/
app.engine('html', swig.renderFile);
app.set('view engine', 'html'); 			// make '.html' the default
app.set('views', app.config.viewsRoot); 	// set views for error and 404 pages
app.set('view cache', false);
app.use(require('compression')());
app.use(express.static(pathLib.join(app.config.staticRoot, 'robots.txt')));
app.use(express.static(pathLib.join(app.config.staticRoot, 'people.txt')));
app.use(require('static-favicon')(pathLib.join(app.config.staticRoot, 'favicon.ico')));

require('./consumer.js')();

if (app.get('env') === 'development') {
	swig.setDefaults({ cache: false });
}

/******************************************************************************/
/* BEGINNING of a DO_NO_TOUCH_ZONE ********************************************/
app.use(helmet.defaults());
app.use(bParser.urlencoded({ extended: true }));
app.use(bParser.json());
app.use(require('method-override')());
app.use(require('express-validator')());
app.use(app.config.staticUrl, express.static(app.config.staticRoot));
app.use(require('cookie-parser')());

var session = require('express-session')
var store = require('connect-mongo')(session)

app.use(session({
	secret: process.env.SESSION_SECRET || 'mysecretes',
	maxAge: new Date(Date.now() + 3600000),
	store: new store({
		// mongoose_connection: mongoose.connection		
		db: mongoose.connection.db
	}),
	cookie: { httpOnly: true }, // secure: true},
	resave: true,
	saveUninitialized: true
}));
app.use(require('csurf')());
/** END of a DO_NO_TOUCH_ZONE -----------------------------------------------**/
/**--------------------------------------------------------------------------**/

/******************************************************************************/
/** BEGINNING of a SHOULD_NOT_TOUCH_ZONE **************************************/
app.use(function(req, res, next){
	res.locals.token = req.csrfToken();	// Add csrf token to views.
	next();
});
app.use(require('connect-flash')()); 		// Flash messages middleware
app.use(passport.initialize());
app.use(passport.session());
/** END of a SHOULD_NOT_TOUCH_ZONE ------------------------------------------**/
/**--------------------------------------------------------------------------**/

app.use(require('./config/middlewares/flash_messages.js'));
app.use(require('./config/middlewares/local_user.js'));
app.use(require('./config/middlewares/all.js'));

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
			colorize: true,
		})
	],
	meta: false,
	msg: "<{{(req.user && req.user.username) || 'anonymous' + '@' + req.connection.remoteAddress}}>: HTTP {{req.method}} {{req.url}}"
}));
/***************************** Don't remove. **********************************/
/******************************************************************************/
/** Error logging (must be after app.use(app.router)) *************************/
// app.use(expressWinston.errorLogger({
// 	transports: [
// 		new winston.transports.Console({
// 			json: true,
// 			colorize: true
// 		}),
// 	],
// }));
/**--------------------------------------------------------------------------**/

require('./config/locals/all.js')(app);

var router = require('./lib/router.js')(app); // Pass routes through router.js
router(require('./app/controllers.js'));
router(require('./guides/controllers.js'));
router(require('./api/controllers.js'));

app.use(require('./config/middlewares/handle_404.js')); // Handle 404 after routes
app.use(require('./config/middlewares/handle_500.js')); // Handle 500 before routes

/******************************************************************************/
/* BEGINNING of a DO_NO_TOUCH_ZONE ********************************************/
var s = app.listen(process.env.PORT || 3000);
console.log('Server on port %d in %s mode', s.address().port, app.settings.env);
/** END of a DO_NO_TOUCH_ZONE -----------------------------------------------**/
/**--------------------------------------------------------------------------**/