
// apps.js
// for meavisa.org, by @f03lipe

// This is the main script.
// Set up everything.

// Attempt to import environment keys (if on production)
try { require('./env.js') } catch (e) {}

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/madb');

var passport = require('passport');
var express = require('express'),
	app = module.exports = express();

require('./config/messages.js').start(app);
require('./config/passport.js')();
require('./config/swig.js')();

app.set('view engine', 'html'); // make '.html' the default
app.set('views', __dirname + '/views'); // set views for error and 404 pages
app.set('view options', {layout: false}); // disable layout
// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like.
// app.set('view cache', false);
app.engine('html', require('consolidate').swig)

app.use(express.static(__dirname + '/static/robots.txt'))
app.use(express.static(__dirname + '/static/people.txt'))
app.use(express.favicon(__dirname + '/static/favicon.ico'))
app.use('/static', express.static(__dirname + '/static')) // serve static files
app.use(express.bodyParser()) // parse request bodies (req.body)
app.use(express.methodOverride()) // support _method (PUT in forms etc)
app.use(express.cookieParser()) // support cookies
app.use(express.session({
	secret: process.env.SESSION_SECRET || 'mysecret',
	maxAge: new Date(Date.now() + 3600000),
	store: 	new (require('connect-mongo')(express))({ mongoose_connection: mongoose.connection })
})) // support sessions
// app.use(express.session({secret: process.env.SESSION_SECRET || 'mysecret'}));
app.use(express.csrf())
app.use(function(req, res, next){ res.locals.token = req.session._csrf; next(); });
// app.use(require('./config/messages.js').message)
app.use(passport.initialize())
app.use(passport.session())
app.use(app.router)
// app.use('/', express.static(__dirname + '/static')) // serve static files from root (put after router)
app.use(express.logger())

app.locals.errors = {}
app.locals.message = {}

require('./routes.js')(app);

app.configure('development', function() {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.locals.pretty = true;
});

app.configure('production', function() {
	app.use(express.errorHandler());
});

var server = require('http')
				.createServer(app)
				.listen(process.env.PORT || 3000, function () {
	console.log('Server on port %d in %s mode', server.address().port, app.settings.env);
});