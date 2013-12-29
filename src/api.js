var User, exports, getBlog, getPostsWithTags, notifyNewPosts, pushBlogTags, request, sendNotification, tumblr, _;

tumblr = require('tumblr');

request = require('request');

_ = require('underscore');

User = require('./models/user.js');

sendNotification = function(user_id, template, callback) {
  var access_token, url;
  access_token = process.env.facebook_access_token;
  url = "https://graph.facebook.com/" + user_id + "/notifications?access_token=" + access_token + "&template=" + (encodeURIComponent(template));
  return request.post(url, function(error, response, body) {
    console.log("Notification request to " + url + " response:", body, error);
    return typeof callback === "function" ? callback(error, response, body) : void 0;
  });
};

getBlog = function(blogurl) {
  return new tumblr.Tumblr(blogurl, process.env.tumblr_ock);
};

pushBlogTags = function(blog, callback) {
  return blog.posts(function(err, data) {
    var tags;
    if (err) {
      return typeof callback === "function" ? callback(err, []) : void 0;
    }
    tags = _.chain(data.posts).pluck('tags').reduceRight((function(a, b) {
      return a.concat(b);
    }), []).value();
    return typeof callback === "function" ? callback(null, tags) : void 0;
  });
};

getPostsWithTags = function(blog, tags, callback) {
  return blog.posts({
    limit: -1
  }, function(err, data) {
    var _posts;
    if (err) {
      return typeof callback === "function" ? callback(err) : void 0;
    }
    _posts = [];
    data.posts.forEach(function(post) {
      var int;
      int = _.intersection(post.tags, tags);
      if (int[0]) {
        return _posts.push(post);
      }
    });
    return typeof callback === "function" ? callback(null, _posts) : void 0;
  });
};

notifyNewPosts = function(callback) {
  var blog, onGetTPosts;
  blog = getBlog('meavisa.tumblr.com');
  onGetTPosts = (function(posts) {
    var onGetUsers;
    onGetUsers = (function(users) {
      var msg, numUsersNotSaved, tags, user, _i, _len;
      numUsersNotSaved = users.length;
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        tags = _.union.apply(null, _.pluck(_.filter(posts, function(post) {
          return new Date(post.date) > new Date(user.lastUpdate);
        }), 'tags'));
        if (tags.length) {
          msg = "We have updates on some of the tags you are following: " + tags.slice(0, 2).join(', ') + ' and more!';
          sendNotification(user.facebookId, msg);
          console.log("To " + user.name + ": " + msg);
        } else {
          console.log("No updates for " + user.name + ".");
        }
        user.lastUpdate = new Date();
        user.save(function(e) {
          numUsersNotSaved -= 1;
          if (numUsersNotSaved === 0) {
            return typeof callback === "function" ? callback() : void 0;
          }
        });
      }
      if (users.length === 0) {
        console.log('No users to notify. Quitting.');
        return callback(null, []);
      }
    });
    return User.find({}, function(err, users) {
      if (err) {
        if (typeof callback === "function") {
          callback(err);
        }
      }
      return onGetUsers(users);
    });
  });
  return blog.posts({
    limit: -1
  }, function(err, data) {
    if (err) {
      if (typeof callback === "function") {
        callback(err);
      }
    }
    return onGetTPosts(data.posts);
  });
};

module.exports = exports = {
  sendNotification: sendNotification,
  getBlog: getBlog,
  pushBlogTags: pushBlogTags,
  getPostsWithTags: getPostsWithTags,
  notifyNewPosts: notifyNewPosts
};
