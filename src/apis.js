
var util = require('util');

var	tumblr	= require('tumblr'),
	oauth	= require('oauth');

try {
	keys = require('./env.js');
} catch(e) {
	keys = {
		twitter: {
			cons_key: process.env.TWT_CONS_KEY,
			cons_sec: process.env.TWT_CONS_SEC,
			access_key: process.env.TWT_ACCESS_KEY,
			access_sec: process.env.TWT_ACCESS_SEC,
		},
		tumblr_ock: process.env.TUMBLR_OCK,
		facebook: {
			app_id: process.env.facebook_app_id,
			secret: process.env.facebook_secret,
			canvas: process.env.facebook_canvas,
		}
	}
}


exports.getTwitterOAuthObj = function (callback_url) {
	console.log('oauth callback set to', callback_url)
	return new oauth.OAuth(
		"https://api.twitter.com/oauth/request_token",
		"https://api.twitter.com/oauth/access_token",
		keys.twitter.cons_key,
		keys.twitter.cons_sec,
		"1.0",
		callback_url,
		"HMAC-SHA1"
	);
}

var TUMB_OCK = keys.tumblr_ock;

exports.getBlog = function (blogurl) {
	return blog = new tumblr.Tumblr(blogurl, TUMB_OCK);
}


exports.getTwitterApi = function () {

	var twit = new Twit({
		consumer_key: keys.twitter.cons_key,
		consumer_secret: keys.twitter.cons_sec,
		access_token: keys.twitter.access_key,
		access_token_secret: keys.twitter.access_sec,
	});

	// twit.post('statuses/update', {
	// 	status: 'hello world!'
	// }, function (err, reply) {
	// 	console.log('ooooi', err)
	// })

	// twit.verifyCredentials(function (err, data) {
	// 	console.log('oi', data);
	// })

	return twit
	
}
