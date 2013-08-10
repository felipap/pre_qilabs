// Generated by CoffeeScript 1.6.3
(function() {
  var User, api, blog, blog_url, getPostsWithTags, models, notify, posts, tags, _;

  _ = require('underscore');

  api = require('./api.js');

  notify = require('./notify.js');

  models = require('./models/models.js');

  User = models.User;

  blog_url = 'http://meavisa.tumblr.com';

  blog = api.getBlog('meavisa.tumblr.com');

  tags = [];

  posts = [];

  api.pushBlogTags(blog, function(err, _tags) {
    if (err) {
      throw err;
    }
    tags = _tags;
    return console.log(tags);
  });

  getPostsWithTags = function(tags, callback) {
    return api.getPostsWithTags(blog, tags, function(err, _posts) {
      posts = _posts;
      return typeof callback === "function" ? callback(err, _posts) : void 0;
    });
  };

  exports.Pages = {
    index: {
      get: function(req, res) {
        if (req.user) {
          console.log('logged:', req.user.name, req.user.tags);
          return getPostsWithTags(req.user.tags, function(err, posts) {
            return res.render('panel', {
              user: req.user,
              tags: tags,
              posts: posts,
              blog_url: blog_url,
              messages: [JSON.stringify(req.user), JSON.stringify(req.session)]
            });
          });
        } else {
          console.log(req);
          return res.render('index');
        }
      }
    },
    tags: {
      get: function(req, res) {
        if (req.user) {
          console.log('user selecting tags:', req.user, req.user.tags);
          return res.render('tags', {
            user: req.user,
            usertags: req.user.tags,
            tags: tags,
            blog_url: blog_url,
            messages: []
          });
        } else {
          return res.redirect('/');
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
          api.sendNotification(req.user.facebookId, "You are following the tags " + (chosen.join(", ")) + ".");
        }
        req.user.tags = chosen;
        req.user.save();
        return getPostsWithTags(chosen, function(err, posts) {
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
