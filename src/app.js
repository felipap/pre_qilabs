
// apps.js

var msgmid = require('./lib/messages.js');
var User = require('./models/user.js');

require('./env.js');

var mongoUri = process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/madb';

require('mongoose').connect(mongoUri);

// var start = app.get('env')=='development'?'http://meavisa.herokuapp.com':'http://localhost:3000';

var passport = require('passport');
(function setPassport() {
	passport.use(new (require('passport-facebook').Strategy)({
			clientID: process.env.facebook_app_id,
			clientSecret: process.env.facebook_secret,
			callbackURL: "/auth/facebook/callback"
		},
		function (accessToken, refreshToken, profile, done) {
			console.log('profile', profile)
			User.findOrCreate({ facebookId: profile.id, name: profile.displayName }, function (err, user) {
				user.accessToken = accessToken;
				user.save();
				if (err) { return done(err); }
					done(null, user);
				});
		}
	));

	passport.serializeUser(function (user, done) {
		return done(null, user._id);
	});

	passport.deserializeUser(function (id, done) {
		User.findOne({_id: id}, function (err, user) {
			return done(err, user);
		});
	})
})();

var express = require('express');
var app = module.exports = express();

app.set('view engine', 'html'); // make ".html" the default
app.set('views', __dirname + '/views'); // set views for error and 404 pages
app.set("view options", {layout: false}); // disable layout
app.use(express.logger()); // log stuff
app.use(express.cookieParser()); // support cookies
app.use(express.bodyParser()); // parse request bodies (req.body)
app.use(express.methodOverride()); // support _method (PUT in forms etc)
app.use(express.session({ secret: process.env.SESSION_SECRET || 'mysecret' })); // support sessions
app.use(passport.initialize());
app.use(passport.session());
app.use(require('./lib/messages.js').message); // addMessageMiddleWare
app.use(app.router);
app.use('/static', express.static(__dirname + '/public')); // serve static files (put after router)
app.engine('html', require('ejs').renderFile); // map .renderFile to ".html" files

msgmid.setUp(app);

require('./routes.js')(app);

var server = require('http')
				.createServer(app)
				.listen(process.env.PORT || 3000, function () {
	console.log("Server on port %d in %s mode", server.address().port, app.settings.env);
});