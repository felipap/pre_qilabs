// Generated by CoffeeScript 1.6.3
(function() {
  var User, api, blog, blog_url, getBlogTags, getPostsWithTags, notify, posts, tags, _;

  _ = require('underscore');

  api = require('./apis.js');

  User = require('./models/user.js');

  notify = require('./notify.js');

  blog_url = 'http://meavisa.tumblr.com';

  blog = api.getBlog("meavisa.tumblr.com");

  tags = [];

  posts = [];

  getBlogTags = function(callback) {
    return blog.posts(function(err, data) {
      var post, tag, _i, _j, _len, _len1, _ref, _ref1;
      if (err) {
        throw err;
      }
      _ref = data.posts;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        post = _ref[_i];
        _ref1 = post.tags;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          tag = _ref1[_j];
          if (tags.indexOf(tag) === -1) {
            tags.push(tag);
            console.log('pushing found tag: #' + tag);
          }
        }
      }
      return typeof callback === "function" ? callback() : void 0;
    });
  };

  getBlogTags();

  getPostsWithTags = function(tags, callback) {
    return blog.posts({
      limit: -1
    }, function(err, data) {
      var _posts;
      _posts = [];
      data.posts.forEach(function(post) {
        var int;
        int = _.intersection(post.tags, tags);
        if (int[0]) {
          return _posts.push(post);
        }
      });
      posts = _posts;
      return typeof callback === "function" ? callback() : void 0;
    });
  };

  exports.Pages = {
    index: {
      get: function(req, res) {
        if (req.user) {
          console.log('logged:', req.user.name);
          return getPostsWithTags(req.user.tags, function() {
            return res.render('panel', {
              user: req.user,
              tags: tags,
              posts: posts,
              blog_url: blog_url,
              messages: [JSON.stringify(req.user), JSON.stringify(req.session)]
            });
          });
        } else {
          return res.render('index');
        }
      }
    },
    logout: {
      get: function(req, res) {
        if (!req.user) {
          return res.redirect('/');
        }
        req.logout();
        return res.redirect('/');
      }
    },
    session: {
      get: function(req, res) {
        if (!req.user || req.user.facebookId !== process.env.facebook_me) {
          return res.redirect('/');
        }
        return User.find({}, function(err, users) {
          var obj;
          obj = {
            ip: req.ip,
            session: req.session,
            users: users
          };
          return res.end(JSON.stringify(obj));
        });
      }
    },
    notify: {
      get: function(req, res) {
        if (!req.user || req.user.facebookId !== process.env.facebook_me) {
          return res.redirect('/');
        }
        notify.notifyNewPosts();
        return res.redirect('/');
      }
    },
    update: {
      get: function(req, res) {
        var chosen;
        if (!req.user) {
          return res.redirect('/');
        }
        if (!req.query['tag'] || typeof req.query['tag'] === 'string') {
          req.query['tag'] = [req.query['tag']];
        }
        chosen = _.filter(req.query['tag'], function(tag) {
          return tag != null;
        });
        if (chosen && !_.isEqual(chosen, req.user.tags)) {
          api.sendNotification(req.user.facebookId, "You are following the tags " + (chosen.join(", ")) + ".");
        }
        req.user.tags = chosen;
        req.user.save();
        return getPostsWithTags(chosen, function() {
          return res.redirect('back');
        });
      }
    },
    dropall: {
      get: function(req, res) {
        if (req.user.facebookId === process.env.facebook_me) {
          return User.remove({}, function(err) {
            res.write("collection removed");
            return res.end(err);
          });
        } else {
          return res.end("Cannot POST /dropall");
        }
      }
    }
  };

}).call(this);
