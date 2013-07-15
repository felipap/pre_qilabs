
var express = require('express');
var http	= require('http');
require('./db.js')

try {
	var env = require('./env.js');
} catch (e) {
	var env = {
		facebook: {
			app_id: process.env.facebook_app_id,
			secret: process.env.facebook_secret,
			canvas: process.env.facebook_canvas,
		}
	}
}

var msgmid 	= require('./lib/messages.js');

// var db = require('./db.js');
// db.connect();

var User	= require('./app/models/user.js');
var mongoUri = process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/madb';

var mongoose = require('mongoose');
mongoose.connect(mongoUri);

// console.log(User)
// var u = new User({name: 'felipe2', password: '123', email: '12312s@gmail.com'});
// u.save(function () { console.log('saved', arguments); })

var passport = require('passport');


start = process.env.MONGOHQ_URL?'http://meavisa.herokuapp.com':'http://localhost:3000';

(function setPassport() {
	passport.use(new (require('passport-facebook').Strategy)({
			clientID: env.facebook.app_id,
			clientSecret: env.facebook.secret,
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

var app = module.exports = express();

app.use(express.bodyParser()); // parse request bodies (req.body)
app.set('view engine', 'html'); // make ".html" the default
app.set('views', __dirname + '/views'); // set views for error and 404 pages
app.set("view options", {layout: false}); // disable layout
app.engine('html', require('ejs').renderFile); // map .renderFile to ".html" files
app.use(express.cookieParser()); // support cookies
app.use(express.methodOverride()); // support _method (PUT in forms etc)
app.use(express.logger()); // log stuff
app.use(express.session({ secret: process.env.SESSION_SECRET || 'mysecret' })); // support sessions
app.use(msgmid.message); // addMessageMiddleWare
app.use(passport.initialize());
app.use(passport.session()); 
app.use(app.router);
app.use(express.static(__dirname + '/public')); // serve static files (put after router)

msgmid.setUp(app);

require('./routes.js')(app);

var port = process.env.PORT || 3000;
var server = http.createServer(app);
server.listen(port, function () {
	console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);
});