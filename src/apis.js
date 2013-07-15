// Generated by CoffeeScript 1.6.3
(function() {
  var TUMB_OCK, e, keys, oauth, request, tumblr, util;

  util = require('util');

  tumblr = require('tumblr');

  oauth = require('oauth');

  request = require('request');

  try {
    keys = require('./env.js');
  } catch (_error) {
    e = _error;
    keys = {
      twitter: {
        cons_key: process.env.TWT_CONS_KEY,
        cons_sec: process.env.TWT_CONS_SEC,
        access_key: process.env.TWT_ACCESS_KEY,
        access_sec: process.env.TWT_ACCESS_SEC
      },
      tumblr_ock: process.env.TUMBLR_OCK,
      facebook: {
        app_id: process.env.facebook_app_id,
        secret: process.env.facebook_secret,
        canvas: process.env.facebook_canvas
      }
    };
  }

  exports.sendNotification = function(user_id, template, callback) {
    var access_token, url;
    access_token = '521238787943358|irzJJKJ0-Z8-LiUshAfFazAirac';
    url = "https://graph.facebook.com/" + user_id + "/notifications?access_token=" + access_token + "&template=" + template;
    return request.post(url, function(error, response, body) {
      console.log("Notification request to " + url + " response:", body, error);
      if (callback) {
        return callback(error, response, body);
      }
    });
  };

  TUMB_OCK = keys.tumblr_ock;

  exports.getBlog = function(blogurl) {
    var blog;
    return blog = new tumblr.Tumblr(blogurl, TUMB_OCK);
  };

}).call(this);
