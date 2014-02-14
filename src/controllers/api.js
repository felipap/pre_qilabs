var HandleErrors, ObjectId, Post, Subscriber, Tag, User, mongoose, required,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

ObjectId = mongoose.Types.ObjectId;

required = require('../lib/required.js');

User = mongoose.model('User');

Post = mongoose.model('Post');

Tag = mongoose.model('Tag');

Subscriber = mongoose.model('Subscriber');

HandleErrors = function(res, cb) {
  return function(err, result) {
    console.log('result:', err, result);
    if (err) {
      return res.status(400).endJson({
        error: true
      });
    } else if (!result) {
      return res.status(404).endJson({
        error: true,
        name: 404
      });
    } else {
      return cb(result);
    }
  };
};

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
    'posts': {
      methods: {
        post: [
          required.login, function(req, res) {
            return req.user.createPost({
              content: {
                title: 'My conquest!' + Math.floor(Math.random() * 100),
                body: req.body.content.body
              }
            }, function(err, doc) {
              return res.end(JSON.stringify({
                error: false
              }));
            });
          }
        ]
      },
      children: {
        '/:id': {
          methods: {
            get: [
              required.login, function(req, res) {
                var e, postId;
                try {
                  postId = new ObjectId.fromString(req.params.id);
                } catch (_error) {
                  e = _error;
                  return res.status(400).endJson({
                    error: true,
                    name: 'InvalidId'
                  });
                }
                return Post.findById(postId, function(err, doc) {
                  if (err) {
                    return res.status(400).endJson({
                      error: true
                    });
                  } else if (!doc) {
                    return res.status(404).endJson({
                      error: true,
                      name: 404
                    });
                  } else {
                    return res.endJson(doc);
                  }
                });
              }
            ]
          },
          children: {
            '/comments': {
              methods: {
                get: [
                  required.login, function(req, res) {
                    var e, postId;
                    try {
                      postId = new ObjectId.fromString(req.params.id);
                    } catch (_error) {
                      e = _error;
                      return res.status(400).endJson({
                        error: true,
                        name: 'InvalidId'
                      });
                    }
                    return Post.findById(postId, HandleErrors(res, function(post) {
                      return post.getComments(HandleErrors(res, function(comments) {
                        return res.endJson({
                          page: 0,
                          data: comments
                        });
                      }));
                    }));
                  }
                ],
                post: [required.login, function(req, res) {}]
              }
            }
          }
        }
      }
    },
    'users': {
      children: {
        ':userId/posts': {
          methods: {
            get: [
              required.login, function(req, res) {
                return User.getPostsFromUser(req.params.userId, {
                  limit: 3,
                  skip: 5 * parseInt(req.query.page)
                }, function(err, docs) {
                  console.log('Fetched board:', docs);
                  return res.end(JSON.stringify({
                    data: docs,
                    page: 0
                  }));
                });
              }
            ]
          }
        },
        ':userId/follow': {
          methods: {
            post: [
              required.login, function(req, res) {
                return req.user.followId(req.params.userId, function(err, done) {
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
        }
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
        'timeline/posts': {
          methods: {
            get: [
              required.login, function(req, res) {
                return req.user.getTimeline({
                  limit: 3,
                  skip: 5 * parseInt(req.query.page)
                }, function(err, docs) {
                  return res.end(JSON.stringify({
                    data: docs,
                    page: parseInt(req.query.page) || 0
                  }));
                });
              }
            ]
          }
        },
        'leave': {
          name: 'user_quit',
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
                req.logout();
                return res.redirect('/');
              }
            ]
          }
        }
      }
    }
  }
};
