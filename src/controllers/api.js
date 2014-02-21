
/*
The controller for /api/* calls.
 */

/*
GUIDELINES for development:
- Keep controllers sanitized ALWAYS.
- Never pass request parameters or data to schema methods, always validate
  before. Use res.paramToObjectId to get create ids:
  `(req, res) -> return unless userId = res.paramToObjectId('userId'); ...`
- Prefer no not handle creation/modification of documents. Leave those to
  schemas statics and methods.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
 */
var Group, HandleErrors, Inbox, ObjectId, Post, Subscriber, Tag, User, mongoose, required, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

_ = require('underscore');

ObjectId = mongoose.Types.ObjectId;

required = require('../lib/required.js');

User = mongoose.model('User');

Post = mongoose.model('Post');

Inbox = mongoose.model('Inbox');

Tag = mongoose.model('Tag');

Group = mongoose.model('Group');

Subscriber = mongoose.model('Subscriber');

HandleErrors = function(res, cb) {
  console.assert(typeof cb === 'function');
  return function(err, result) {
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
      return cb.apply(cb, [].splice.call(arguments, 1));
    }
  };
};

module.exports = {
  children: {
    'session': {
      permissions: [required.isMe],
      methods: {
        get: function(req, res) {
          return User.find({}, function(err, users) {
            return Post.find({}, function(err, posts) {
              return Inbox.find({}, function(err, inboxs) {
                return Subscriber.find({}, function(err, subscribers) {
                  return Group.find({}, function(err, groups) {
                    return Group.Membership.find({}, function(err, membership) {
                      var obj;
                      obj = {
                        ip: req.ip,
                        group: groups,
                        inboxs: inboxs,
                        membership: membership,
                        session: req.session,
                        users: users,
                        posts: posts,
                        subscribers: subscribers
                      };
                      return res.end(JSON.stringify(obj));
                    });
                  });
                });
              });
            });
          });
        }
      }
    },
    'testers': {
      permissions: [required.logout],
      post: function(req, res) {
        var errors;
        req.assert('email', 'Email inválido.').notEmpty().isEmail();
        if (errors = req.validationErrors()) {
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
    },
    'labs': {
      permissions: [required.login],
      post: function(req, res) {
        return req.user.createGroup({
          profile: {
            name: req.body.name
          }
        }, function(err, doc) {
          if (err) {
            req.flash('err', err);
            if (err) {
              res.redirect('/labs/create');
            }
            return;
          }
          return res.redirect('/labs/' + doc.id);
        });
      },
      children: {
        ':id/posts': {
          get: function(req, res) {
            var id;
            if (!(id = req.paramToObjectId('id'))) {
              return;
            }
            return Group.findOne({
              _id: id
            }, HandleErrors(res, function(group) {
              return req.user.getLabPosts({
                limit: 3,
                skip: 5 * parseInt(req.query.page)
              }, group, HandleErrors(res, function(docs) {
                var page;
                page = (!docs[0] && -1) || parseInt(req.query.page) || 0;
                return res.endJson({
                  data: docs,
                  error: false,
                  page: page
                });
              }));
            }));
          }
        },
        ':id/addUser/:userId': {
          get: function(req, res) {
            var id, userId;
            if (!(id = req.paramToObjectId('id'))) {
              return;
            }
            if (!(userId = req.paramToObjectId('userId'))) {
              return;
            }
            return Group.findOne({
              _id: id
            }, HandleErrors(res, function(group) {
              return User.findOne({
                _id: userId
              }, HandleErrors(res, function(user) {
                var type;
                type = Group.Membership.Types.Member;
                return req.user.addUserToGroup(user, group, type, function(err, membership) {
                  return res.endJson({
                    error: !!err,
                    membership: membership
                  });
                });
              }));
            }));
          }
        }
      }
    },
    'posts': {
      permissions: [required.login],
      post: function(req, res) {
        var e, groupId;
        if (req.body.groupId) {
          try {
            groupId = new ObjectId.fromString(req.body.groupId);
          } catch (_error) {
            e = _error;
            return res.endJson({
              error: true,
              name: 'InvalidId'
            });
          }
        } else {
          groupId = null;
        }
        return req.user.createPost({
          groupId: groupId,
          content: {
            title: 'My conquest!' + Math.floor(Math.random() * 100),
            body: req.body.content.body
          }
        }, function(err, doc) {
          return doc.populate('author', function(err, doc) {
            return res.end(JSON.stringify({
              error: false,
              data: doc
            }));
          });
        });
      },
      children: {
        '/:id': {
          methods: {
            get: function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return Post.findOne({
                _id: postId
              }, HandleErrors(res, function(doc) {
                return Post.find({
                  parentPost: doc
                }).populate('author').exec(HandleErrors(res, function(docs) {
                  return res.endJson(_.extend({}, doc.toObject(), {
                    comments: docs
                  }));
                }));
              }));
            },
            post: function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {

              }
            },
            "delete": function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return Post.findOne({
                _id: postId,
                author: req.user
              }, HandleErrors(res, function(doc) {
                doc.remove();
                return res.endJson(doc);
              }));
            }
          },
          children: {
            '/comments': {
              methods: {
                get: function(req, res) {
                  var postId;
                  if (!(postId = req.paramToObjectId('id'))) {
                    return;
                  }
                  return Post.findById(postId).populate('author').exec(HandleErrors(res, function(post) {
                    return post.getComments(HandleErrors(res, function(comments) {
                      return res.endJson({
                        data: comments,
                        error: false,
                        page: -1
                      });
                    }));
                  }));
                },
                post: function(req, res) {
                  var data, postId;
                  if (!(postId = req.paramToObjectId('id'))) {
                    return;
                  }
                  data = {
                    content: {
                      body: req.body.content.body
                    }
                  };
                  return Post.findById(postId, HandleErrors(res, (function(_this) {
                    return function(parentPost) {
                      return req.user.commentToPost(parentPost, data, HandleErrors(res, function(doc) {
                        return doc.populate('author', HandleErrors(res, function(doc) {
                          return res.endJson({
                            error: false,
                            data: doc
                          });
                        }));
                      }));
                    };
                  })(this)));
                }
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
                var userId;
                if (!(userId = req.paramToObjectId('userId'))) {
                  return;
                }
                return User.getPostsFromUser(userId, {
                  limit: 3,
                  skip: 5 * parseInt(req.query.page)
                }, HandleErrors(res, function(docs) {
                  return res.end(JSON.stringify({
                    data: docs,
                    error: false,
                    page: parseInt(req.query.page)
                  }));
                }));
              }
            ]
          }
        },
        ':userId/follow': {
          methods: {
            post: [
              required.login, function(req, res) {
                var userId;
                if (!(userId = req.paramToObjectId('userId'))) {
                  return;
                }
                return User.findOne({
                  _id: userId
                }, HandleErrors(res, (function(user) {
                  return req.user.dofollowUser(user, function(err, done) {
                    return res.end(JSON.stringify({
                      error: !!err
                    }));
                  });
                })));
              }
            ]
          }
        },
        ':userId/unfollow': {
          methods: {
            post: [
              required.login, function(req, res) {
                var userId;
                if (!(userId = req.paramToObjectId('userId'))) {
                  return;
                }
                return User.findOne({
                  _id: userId
                }, function(err, user) {
                  return req.user.unfollowUser(user, function(err, done) {
                    return res.end(JSON.stringify({
                      error: !!err
                    }));
                  });
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
                  limit: 10,
                  skip: 5 * parseInt(req.query.page)
                }, function(err, docs) {
                  var page;
                  page = (!docs[0] && -1) || parseInt(req.query.page) || 0;
                  return res.end(JSON.stringify({
                    page: page,
                    data: docs,
                    error: false
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
