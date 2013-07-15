var async   = require('async');
var express = require('express');
var util    = require('util');

// create an express webserver
var app = express.createServer(
  express.logger(),
  express.static(__dirname + '/public'),
  express.bodyParser(),
  express.cookieParser(),
  // set this to a secret value to encrypt session cookies
  express.session({ secret: process.env.SESSION_SECRET || 'secret123' }),
  require('faceplate').middleware({
    app_id: process.env.FACEBOOK_APP_ID,
    secret: process.env.FACEBOOK_SECRET,
    scope:  'user_likes,user_photos,user_photo_video_tags'
  })
);

/*
crypto = require 'crypto'
 
class SignedRequest
  constructor: (@secret, @request) ->
    [@encodedSignature, @encoded] = @request.split '.'
    @signature = @base64decode @encodedSignature
    @decoded = @base64decode @encoded
    @data = JSON.parse @decoded
 
  verify: =>
    return false unless @data.algorithm == 'HMAC-SHA256'
 
    hmac = crypto.createHmac 'SHA256', @secret
    hmac.update @encoded
    # base64url encoding; can't use method as data from hmac is binary
    result = hmac.digest('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .replace(/\=/g, '')
    result == @encodedSignature
 
  base64encode: (data) ->
    new Buffer(data, 'utf8')
      .toString('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .replace(/\=/g, '')
 
  base64decode: (data) ->
    while data.length % 4 != 0
      data += '='
    data = data.replace(/-/g, '+').replace(/_/g, '/')
    new Buffer(data, 'base64').toString('utf-8')
 
module.exports = SignedRequest*/

// listen to the PORT given to us in the environment
var port = process.env.PORT || 4000;

app.listen(port, function() {
  console.log("Listening on " + port);
});

app.dynamicHelpers({
  'host': function(req, res) {
    return req.headers['host'];
  },
  'scheme': function(req, res) {
    return req.headers['x-forwarded-proto'] || 'http';
  },
  'url': function(req, res) {
    return function(path) {
      return app.dynamicViewHelpers.scheme(req, res) + app.dynamicViewHelpers.url_no_scheme(req, res)(path);
    }
  },
  'url_no_scheme': function(req, res) {
    return function(path) {
      return '://' + app.dynamicViewHelpers.host(req, res) + (path || '');
    }
  },
});

function render_page(req, res) {
  res.end(JSON.stringify(req.body));
  return;
  req.facebook.app(function(err, app) {
    req.facebook.me(function(user) {
      res.render('index.ejs', {
        layout:    false,
        req:       req,
        app:       app,
        user:      user
      });
    });
  });
}

function handle_facebook_request(req, res) {

  // if the user is logged in
  if (req.facebook.token) {

    async.parallel([
      function(cb) {
        // query 4 friends and send them to the socket for this socket id
        req.facebook.get('/me/friends', { limit: 4 }, function(friends) {
          req.friends = friends;
          cb();
        });
      },
      function(cb) {
        // query 16 photos and send them to the socket for this socket id
        req.facebook.get('/me/photos', { limit: 16 }, function(photos) {
          req.photos = photos;
          cb();
        });
      },
      function(cb) {
        // query 4 likes and send them to the socket for this socket id
        req.facebook.get('/me/likes', { limit: 4 }, function(likes) {
          req.likes = likes;
          cb();
        });
      },
      function(cb) {
        // use fql to get a list of my friends that are using this app
        req.facebook.fql('SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1', function(result) {
          req.friends_using_app = result;
          cb();
        });
      }
    ], function() {
      render_page(re, res);
    });

  } else {
    render_page(req, res);
  }
}

app.get('/', handle_facebook_request);
app.post('/', handle_facebook_request);
