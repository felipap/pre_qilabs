var pages, passport, requireLogged, requireMe, staticPage;

passport = require('passport');

pages = require('./pages.js');

requireLogged = function(req, res, next) {
  if (!req.user) {
    return res.redirect('/');
  }
  return next();
};

requireMe = function(req, res, next) {
  if (!req.user || req.user.facebookId !== process.env.facebook_me) {
    res.locals.message = ['what do you think you\'re doing?'];
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
    methods: pages.Pages.index
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
          ]
        }
      },
      'tags': {
        methods: {
          get: [requireLogged, pages.Tags.get],
          post: [requireLogged, pages.Tags.post]
        },
        children: {
          ':tag': {
            methods: {
              put: [requireLogged, pages.Tags.put]
            }
          },
          'template': {
            methods: {
              get: [requireLogged, pages.Tags.template]
            }
          }
        }
      },
      'posts': {
        methods: {
          get: [requireLogged, pages.Posts.get]
        },
        children: {
          'template': {
            methods: {
              get: [requireLogged, pages.Posts.template]
            }
          }
        }
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
