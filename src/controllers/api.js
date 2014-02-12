var Post, Subscriber, Tag, User, required,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

User = require('../models/user.js');

Post = require('../models/post.js');

Tag = require('../models/tag.js');

Subscriber = require('../models/subscriber.js');

required = require('../lib/required.js');

module.exports = {
  children: {
    'session': {
      methods: {
        get: [
          required.isMe, function(req, res) {
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
          required.logout, function(req, res) {
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
          required.login, function(req, res) {
            return res.end(JSON.stringify(Tag.checkFollowed(tags, req.user.tags)));
          }
        ],
        post: [
          required.login, function(req, res) {
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
              required.login, function(req, res) {
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
    'board/posts': {
      methods: {
        get: [
          required.login, function(req, res) {
            return req.user.getBoard({
              limit: 10
            }, function(err, docs) {
              console.log('returning docs:', docs);
              return res.end(JSON.stringify({
                data: docs,
                page: 0
              }));
            });
          }
        ]
      }
    },
    'timeline/posts': {
      methods: {
        get: [
          required.login, function(req, res) {
            return req.user.getInbox({
              limit: 10
            }, function(err, docs) {
              console.log('returning docs:', docs);
              return res.end(JSON.stringify({
                data: docs,
                page: 0
              }));
            });
          }
        ]
      }
    },
    'posts': {
      methods: {
        get: [
          required.login, function(req, res) {
            var page, seltags;
            if (req.query.tags) {
              seltags = req.query.tags.split(',');
            } else {
              seltags = req.user.tags;
            }
            page = parseInt(req.query.page) || 0;
            return Post.getWithTags(seltags, function(err, docs) {
              docs = docs.slice(page * 5, (page + 1) + 5);
              console.log('length of posts:', docs.length);
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
              required.login, function(req, res) {
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
    'users': {
      children: {
        ':userId/follow': {
          methods: {
            post: [
              required.login, function(req, res) {
                return req.user.dofollowId(req.params.userId, function(err, done) {
                  return res.end(JSON.stringify({
                    error: !!err
                  }));
                });
              }
            ]
          }
        },
        ':userId/unfollow': {
          methods: {
            post: [
              required.login, function(req, res) {
                return req.user.unfollowId(req.params.userId, function(err, done) {
                  return res.end(JSON.stringify({
                    error: !!err
                  }));
                });
              }
            ]
          }
        },
        'me': {
          methods: {
            post: [
              required.login, function(req, res) {
                if ('off' === req.query.notifiable) {
                  req.user.notifiable = false;
                  req.user.save();
                } else if (__indexOf.call(req.query.notifiable, 'on') >= 0) {
                  req.user.notifiable = true;
                  req.user.save();
                }
                return res.end();
              }
            ]
          },
          children: {
            'leave': {
              name: 'quit',
              methods: {
                post: [
                  required.login, function(req, res) {
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
                  required.login, function(req, res) {
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
    }
  }
};
