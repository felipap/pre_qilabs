var Post, Subscriber, Tag, User, api, blog, blog_url, passport, posts, require, staticPage, tags, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

_ = require('underscore');

passport = require('passport');

api = require('./api.js');

User = require('./models/user.js');

Post = require('./models/post.js');

Tag = require('./models/tag.js');

Subscriber = require('./models/subscriber.js');

blog_url = 'http://meavisa.tumblr.com';

blog = api.getBlog('meavisa.tumblr.com');

tags = [];

posts = [];

Tag.fetchAndCache();

Post.fetchAndCache();

require = {
  isNotLogged: function(req, res, next) {
    if (req.user) {
      if (req.accepts('json')) {
        return res.status(403).end();
      } else {
        return res.redirect('/');
      }
    } else {
      return next();
    }
  },
  isLogged: function(req, res, next) {
    if (!req.user) {
      return res.redirect('/');
    } else {
      return next();
    }
  },
  isMe: function(req, res, next) {
    if (!req.user || req.user.facebookId !== process.env.facebook_me) {
      return res.redirect('/');
    } else {
      return next();
    }
  }
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
          return res.redirect('/feed');
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
  '/feed': {
    name: 'index',
    methods: {
      get: [
        require.isLogged, function(req, res) {
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
        }
      ],
      post: function(req, res) {
        return res.end('<html><head></head><body><script type="text/javascript">' + 'window.top.location="http://meavisa.herokuapp.com"</script>' + '</body></html>');
      }
    }
  },
  '/sobre': staticPage('pages/about', 'about'),
  '/equipe': staticPage('pages/team', 'team'),
  '/participe': staticPage('pages/join-team', 'join-team'),
  '/painel': {
    name: 'panel',
    methods: {
      get: [
        require.isLogged, function(req, res) {
          return res.render('pages/panel', {
            user: req.user
          });
        }
      ]
    }
  },
  '/tags/:tag': {
    methods: {
      get: function(req, res) {}
    }
  },
  '/p/:user': {
    methods: {
      get: function(req, res) {
        return res.render('pages/profile', {
          user: req.user,
          profile: {
            user: req.user
          }
        });
      }
    },
    name: 'profile'
  },
  '/api': {
    children: {
      'dropall': {
        methods: {
          get: [
            require.isMe, function(req, res) {
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
            require.isMe, function(req, res) {
              if (!req.user || req.user.facebookId !== process.env.facebook_me) {
                return res.redirect('/');
              }
              return User.find({}, function(err, users) {
                return Post.find({}, function(err, posts) {
                  return Subscriber.find({}, function(err, subscribers) {
                    return Tag.getAll(function(err, tags) {
                      var obj;
                      obj = {
                        ip: req.ip,
                        session: req.session,
                        users: users,
                        tags: tags,
                        posts: posts,
                        subscribers: subscribers
                      };
                      return res.end(JSON.stringify(obj));
                    });
                  });
                });
              });
            }
          ]
        }
      },
      'testers': {
        methods: {
          post: [
            require.isNotLogged, function(req, res) {
              var errors;
              req.assert('email', 'Email inválido.').notEmpty().isEmail();
              if (errors = req.validationErrors()) {
                console.log('invalid', errors);
                req.flash('warn', 'Parece que esse email que você digitou é inválido. :O &nbsp;');
                return res.redirect('/');
              } else {
                return Subscriber.findOrCreate({
                  email: req.body.email
                }, function(err, doc, isNew) {
                  if (err) {
                    req.flash('warn', 'Tivemos problemas para processar o seu email. :O &nbsp;');
                  } else if (!isNew) {
                    req.flash('info', 'Ops. Seu email já estava aqui! Adicionamos ele à lista de prioridades. :) &nbsp;');
                  } else {
                    req.flash('info', 'Sucesso! Entraremos em contato. \o/ &nbsp;');
                  }
                  return res.redirect('/');
                });
              }
            }
          ]
        }
      },
      'tags': {
        methods: {
          get: [
            require.isLogged, function(req, res) {
              return res.end(JSON.stringify(Tag.checkFollowed(tags, req.user.tags)));
            }
          ],
          post: [
            require.isLogged, function(req, res) {
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
                require.isLogged, function(req, res) {
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
            require.isLogged, function(req, res) {
              var page, seltags;
              if (req.query.tags) {
                seltags = req.query.tags.split(',');
              } else {
                seltags = req.user.tags;
              }
              page = parseInt(req.query.page) || 0;
              return Post.getWithTags(seltags, function(err, docs) {
                docs = docs.slice(page * 5, (page + 1) + 5);
                console.log(docs.length);
                return res.end(JSON.stringify({
                  data: docs,
                  page: page
                }));
              });
            }
          ]
        },
        children: {
          ':id': {
            methods: {
              get: [
                require.isLogged, function(req, res) {
                  return Post.findOne({
                    tumblrId: req.params.id
                  }, function(err, doc) {
                    return res.end(JSON.stringify(doc));
                  });
                }
              ]
            }
          }
        }
      },
      'user': {
        methods: {
          post: [
            require.isLogged, function(req, res) {
              if ('off' === req.query.notifiable) {
                req.user.notifiable = false;
                req.user.save();
              } else if (__indexOf.call(req.query.notifiable, 'on') >= 0) {
                req.user.notifiable = true;
                req.user.save();
              }
              console.log(req.user.notifiable, req.query.notifiable, typeof req.query.notifiable);
              return res.end();
            }
          ]
        },
        children: {
          'leave': {
            methods: {
              post: [
                require.isLogged, function(req, res) {
                  return req.user.remove(function(err, data) {
                    if (err) {
                      throw err;
                    }
                    req.logout();
                    return res.redirect('/');
                  });
                }
              ]
            }
          },
          'logout': {
            name: 'logout',
            methods: {
              post: [
                require.isLogged, function(req, res) {
                  if (!req.user) {
                    return res.redirect('/');
                  }
                  req.logout();
                  return res.redirect('/');
                }
              ]
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
