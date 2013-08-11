// Generated by CoffeeScript 1.6.3
(function() {
  var Post, User, api, blog, blog_url, getPost, getPostsWithTags, posts, tags, tposts, _;

  _ = require('underscore');

  api = require('./api.js');

  User = require('./models/user.js');

  Post = require('./models/post.js');

  blog_url = 'http://meavisa.tumblr.com';

  blog = api.getBlog('meavisa.tumblr.com');

  tags = [];

  posts = [];

  tposts = [];

  api.pushBlogTags(blog, function(err, _tags) {
    var tag, _i, _len, _results;
    if (err) {
      throw err;
    }
    tags = _tags;
    _results = [];
    for (_i = 0, _len = _tags.length; _i < _len; _i++) {
      tag = _tags[_i];
      _results.push(console.log('pushing found tag: #' + tag));
    }
    return _results;
  });

  getPostsWithTags = function(tags, callback) {
    return api.getPostsWithTags(blog, tags, function(err, _posts) {
      posts = _posts;
      return typeof callback === "function" ? callback(err, _posts) : void 0;
    });
  };

  getPost = function(callback) {
    return api.pushNewPosts(function(err, data) {
      return posts = data;
    });
  };

  exports.Pages = {
    index: {
      get: function(req, res) {
        if (req.user) {
          console.log('logged:', req.user.name, req.user.tags);
          return getPostsWithTags(req.user.tags, function(err, tposts) {
            return res.render('panel', {
              user: req.user,
              tags: tags,
              posts: tposts,
              blog_url: blog_url,
              messages: [JSON.stringify(req.user), JSON.stringify(req.session)]
            });
          });
        } else {
          return User.find().sort({
            '_id': 'descending'
          }).limit(10).find(function(err, data) {
            return res.render('index', {
              latestSignIns: data
            });
          });
        }
      },
      post: function(req, res) {
        return res.end('<html><head></head><body><script type="text/javascript">' + 'window.top.location="http://meavisa.herokuapp.com";</script>' + '</body></html>');
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
          return Post.find({}, function(err, posts) {
            var obj;
            obj = {
              ip: req.ip,
              session: req.session,
              users: users,
              posts: posts
            };
            return res.end(JSON.stringify(obj));
          });
        });
      }
    },
    post: {
      get: function(req, res, id) {
        return blog.posts({
          id: id
        }, (function(err, data) {
          return res.write(JSON.stringify(data));
        }));
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

        }
        req.user.tags = chosen;
        req.user.save();
        return getPostsWithTags(chosen, function(err, posts) {
          return res.redirect('back');
        });
      }
    },
    leave: {
      get: function(req, res) {
        if (!req.user) {
          return res.redirect('/');
        }
        return req.user.remove(function(err, data) {
          if (err) {
            throw err;
          }
          req.logout();
          return res.redirect('/');
        });
      }
    },
    dropall: {
      get: function(req, res) {
        var _ref;
        if (((_ref = req.user) != null ? _ref.facebookId : void 0) === process.env.facebook_me) {
          return User.remove({}, function(err) {
            res.write("users removed");
            return Post.remove({}, function(err) {
              res.write("\nposts removed");
              return res.end(err);
            });
          });
        } else {
          return res.redirect("/");
        }
      }
    }
  };

}).call(this);
