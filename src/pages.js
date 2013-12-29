var Post, Tag, User, api, blog, blog_url, passport, posts, requireLogged, requireMe, staticPage, tags, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

_ = require('underscore');

passport = require('passport');

api = require('./api.js');

User = require('./models/user.js');

Post = require('./models/post.js');

Tag = require('./models/tag.js');

blog_url = 'http://meavisa.tumblr.com';

blog = api.getBlog('meavisa.tumblr.com');

tags = [];

posts = [];

Tag.fetchAndCache();

requireLogged = function(req, res, next) {
  if (!req.user) {
    return res.redirect('/');
  }
  return next();
};

requireMe = function(req, res, next) {
  if (!req.user || req.user.facebookId !== process.env.facebook_me) {
    req.flash('warn', 'what do you think you\'re doing?');
    return res.redirect('/');
  }
  return next();
};

staticPage = function(template, name) {
  return {
    name: name,
    methods: {
      get: function(req, res) {
        return res.render(template, {
          user: req.user
        });
      }
    }
  };
};

module.exports = {
  '/': {
    name: 'index',
    methods: {
      get: function(req, res) {
        if (req.user) {
          req.user.lastUpdate = new Date();
          req.user.save();
          return Tag.getAll(function(err, tags) {
            return res.render('pages/home', {
              user: req.user,
              tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
            });
          });
        } else {
          return User.find().sort({
            '_id': 'descending'
          }).limit(10).find(function(err, data) {
            return res.render('pages/frontpage', {
              latestSignIns: data
            });
          });
        }
      },
      post: function(req, res) {
        return res.end('<html><head></head><body><script type="text/javascript">' + 'window.top.location="http://meavisa.herokuapp.com"</script>' + '</body></html>');
      }
    }
  },
  '/logout': {
    name: 'logout',
    methods: {
      post: [
        requireLogged, function(req, res) {
          if (!req.user) {
            return res.redirect('/');
          }
          req.logout();
          return res.redirect('/');
        }
      ]
    }
  },
  '/leave': {
    name: 'leave',
    methods: {
      get: function(req, res) {
        return req.user.remove(function(err, data) {
          if (err) {
            throw err;
          }
          req.logout();
          return res.redirect('/');
        });
      }
    }
  },
  '/painel': staticPage('pages/panel', 'panel'),
  '/sobre': staticPage('pages/about', 'about'),
  '/equipe': staticPage('pages/team', 'team'),
  '/tags/:tag': {
    methods: {
      get: function(req, res) {}
    }
  },
  '/api': {
    children: {
      'dropall': {
        methods: {
          get: [
            requireMe, function(req, res) {
              var waiting;
              waiting = 3;
              User.remove({
                id: 'a'
              }, function(err) {
                res.write("users removed");
                if (!--waiting) {
                  return res.end(err);
                }
              });
              Post.remove({
                id: 'a'
              }, function(err) {
                res.write("\nposts removed");
                if (!--waiting) {
                  return res.end(err);
                }
              });
              return Tag.remove({
                id: 'a'
              }, function(err) {
                res.write("\nposts removed");
                if (!--waiting) {
                  return res.end(err);
                }
              });
            }
          ]
        }
      },
      'session': {
        methods: {
          get: [
            requireMe, function(req, res) {
              if (!req.user || req.user.facebookId !== process.env.facebook_me) {
                return res.redirect('/');
              }
              return User.find({}, function(err, users) {
                return Post.find({}, function(err, posts) {
                  return Tag.getAll(function(err, tags) {
                    var obj;
                    obj = {
                      ip: req.ip,
                      session: req.session,
                      users: users,
                      tags: tags,
                      posts: posts
                    };
                    return res.end(JSON.stringify(obj));
                  });
                });
              });
            }
          ]
        }
      },
      'tags': {
        methods: {
          get: [
            requireLogged, function(req, res) {
              return res.end(JSON.stringify(Tag.checkFollowed(tags, req.user.tags)));
            }
          ],
          post: [
            requireLogged, function(req, res) {
              var checked;
              checked = req.body.checked;
              req.user.tags = checked;
              req.user.save();
              req.flash('info', 'Tags atualizadas com sucesso!');
              return res.end();
            }
          ]
        },
        children: {
          ':tag': {
            methods: {
              put: [
                requireLogged, function(req, res) {
                  var _ref;
                  console.log('did follow');
                  console.log('didn\'t follow');
                  if (_ref = req.params.tag, __indexOf.call(req.user.tags, _ref) >= 0) {
                    req.user.tags.splice(req.user.tags.indexOf(req.params.tag), 1);
                  } else {
                    req.user.tags.push(req.params.tag);
                  }
                  req.user.save();
                  return res.end();
                }
              ]
            }
          }
        }
      },
      'posts': {
        methods: {
          get: [
            requireLogged, function(req, res) {
              var seltags;
              if (req.query.tags) {
                seltags = req.query.tags.split(',');
              } else {
                seltags = req.user.tags;
              }
              return Post.getWithTags(seltags, function(err, tposts) {
                return res.end(JSON.stringify(tposts));
              });
            }
          ]
        },
        children: {}
      }
    }
  },
  '/auth/facebook/callback': {
    methods: {
      get: passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/login'
      })
    }
  },
  '/auth/facebook': {
    methods: {
      get: passport.authenticate('facebook')
    }
  }
};
