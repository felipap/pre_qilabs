
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
var Activity, Follow, Group, HandleErrResult, Inbox, Notification, ObjectId, Post, Resource, Subscriber, Tag, User, mongoose, required, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

_ = require('underscore');

ObjectId = mongoose.Types.ObjectId;

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

User = mongoose.model('User');

Post = Resource.model('Post');

Tag = mongoose.model('Tag');

Inbox = mongoose.model('Inbox');

Group = mongoose.model('Group');

Follow = mongoose.model('Follow');

Activity = mongoose.model('Activity');

Subscriber = mongoose.model('Subscriber');

Notification = mongoose.model('Notification');

HandleErrResult = function(res) {
  return function(cb) {
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
};

module.exports = {
  children: {
    'session': {
      permissions: [required.isMe],
      methods: {
        get: function(req, res) {
          console.log(req.query);
          if (req.query.user != null) {
            return User.find({}, function(err, users) {
              return res.endJson({
                users: users
              });
            });
          } else if (req.query.inbox != null) {
            return Inbox.find({}).populate('resource').exec(function(err, inboxs) {
              return res.endJson({
                err: err,
                inboxs: inboxs
              });
            });
          } else if (req.query.group != null) {
            return Group.find({}, function(err, groups) {
              return res.endJson({
                group: groups
              });
            });
          } else if (req.query.notification != null) {
            return Notification.find({}, function(err, notifics) {
              return res.endJson({
                notifics: notifics
              });
            });
          } else if (req.query.membership != null) {
            return Group.Membership.find({}, function(err, membership) {
              return res.endJson({
                membership: membership
              });
            });
          } else if (req.query.post != null) {
            return Post.find({}, function(err, posts) {
              return res.endJson({
                posts: posts
              });
            });
          } else if (req.query.follow != null) {
            return Follow.find({}, function(err, follows) {
              return res.endJson({
                follows: follows
              });
            });
          } else if (req.query.subscriber != null) {
            return Subscriber.find({}, function(err, subscribers) {
              return res.endJson({
                subscribers: subscribers
              });
            });
          } else if (req.query.note != null) {
            return res.endJson({
              notes: notes
            });
          } else if (req.query.session != null) {
            res.endJson({
              ip: req.ip,
              session: req.session
            });
            return Activity.find({}, function(err, notes) {});
          } else {
            return User.find({}, function(err, users) {
              return Post.find({}, function(err, posts) {
                return Inbox.find({}, function(err, inboxs) {
                  return Subscriber.find({}, function(err, subscribers) {
                    return Follow.find({}, function(err, follows) {
                      return Notification.find({}, function(err, notifics) {
                        return Group.find({}, function(err, groups) {
                          Group.Membership.find({}, function(err, memberships) {
                            var obj;
                            return obj = {
                              ip: req.ip,
                              group: groups
                            };
                          });
                          Activity.find({}, function(err, notes) {
                            return {
                              inboxs: inboxs,
                              notifics: notifics,
                              membership: memberships,
                              session: req.session,
                              users: users,
                              posts: posts,
                              follows: follows,
                              notes: notes,
                              subscribers: subscribers
                            };
                          });
                          return res.endJson(obj);
                        });
                      });
                    });
                  });
                });
              });
            });
          }
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
    'labs': require('./api_lab'),
    'posts': {
      permissions: [required.login],
      children: {
        '/:id': {
          get: function(req, res) {
            var postId;
            if (!(postId = req.paramToObjectId('id'))) {
              return;
            }
            console.log('oi?');
            return Post.findOne({
              _id: postId
            }, HandleErrResult(res)(function(doc) {
              return doc.fillComments(function(err, object) {
                return res.endJson({
                  error: false,
                  data: object
                });
              });
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
            }, HandleErrResult(res)(function(doc) {
              Inbod.remove({
                resource: doc
              }, function(err, num) {});
              doc.remove();
              return res.endJson(doc);
            }));
          },
          children: {
            '/comments': {
              methods: {
                get: function(req, res) {
                  var postId;
                  if (!(postId = req.paramToObjectId('id'))) {
                    return;
                  }
                  return Post.findById(postId).populate('author').exec(HandleErrResult(res)(function(post) {
                    return post.getComments(HandleErrResult(res)(function(comments) {
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
                  return Post.findById(postId, HandleErrResult(res)((function(_this) {
                    return function(parentPost) {
                      return req.user.commentToPost(parentPost, data, HandleErrResult(res)(function(doc) {
                        return doc.populate('author', HandleErrResult(res)(function(doc) {
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
                }, HandleErrResult(res)(function(docs) {
                  return res.endJson({
                    data: docs,
                    error: false,
                    page: parseInt(req.query.page)
                  });
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
                }, HandleErrResult(res)(function(user) {
                  return req.user.dofollowUser(user, function(err, done) {
                    return res.endJson({
                      error: !!err
                    });
                  });
                }));
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
                    return res.endJson({
                      error: !!err
                    });
                  });
                });
              }
            ]
          }
        }
      }
    },
    'me': {
      permissions: [required.login],
      post: function(req, res) {
        if ('off' === req.query.notifiable) {
          req.user.notifiable = false;
          req.user.save();
        } else if (__indexOf.call(req.query.notifiable, 'on') >= 0) {
          req.user.notifiable = true;
          req.user.save();
        }
        return res.end();
      },
      children: {
        'notifications': {
          get: function(req, res) {
            return req.user.getNotifications(HandleErrResult(req)(function(notes) {
              return res.endJson({
                data: notes,
                error: false
              });
            }));
          },
          children: {
            ':id/access': {
              get: function(req, res) {
                var nId;
                if (!(nId = req.paramToObjectId('id'))) {
                  return;
                }
                return Notification.update({
                  recipient: req.user.id,
                  _id: nId
                }, {
                  accessed: true,
                  seen: true
                }, {
                  multi: false
                }, function(err) {
                  return res.endJson({
                    error: !!err
                  });
                });
              }
            },
            'seen': {
              post: function(req, res) {
                res.end();
                return Notification.update({
                  recipient: req.user.id
                }, {
                  seen: true
                }, {
                  multi: true
                }, function(err) {
                  return res.endJson({
                    error: !!err
                  });
                });
              }
            }
          }
        },
        'timeline/posts': {
          post: function(req, res) {
            return req.user.createPost({
              groupId: null,
              content: {
                title: 'My conquest!' + Math.floor(Math.random() * 100),
                body: req.body.content.body
              }
            }, HandleErrResult(res)(function(doc) {
              return doc.populate('author', function(err, doc) {
                return res.endJson({
                  error: false,
                  data: doc
                });
              });
            }));
          },
          get: function(req, res) {
            var opts;
            opts = {
              limit: 10
            };
            if (parseInt(req.query.maxDate)) {
              opts.maxDate = parseInt(req.query.maxDate);
            }
            return req.user.getTimeline(opts, HandleErrResult(res)(function(docs) {
              var minDate;
              if (docs.length === opts.limit) {
                minDate = docs[docs.length - 1].dateCreated.valueOf();
              } else {
                minDate = -1;
              }
              return res.endJson({
                minDate: minDate,
                data: docs,
                error: false
              });
            }));
          }
        },
        'leave': {
          name: 'user_quit',
          post: function(req, res) {
            return req.user.remove(function(err, data) {
              if (err) {
                throw err;
              }
              req.logout();
              return res.redirect('/');
            });
          }
        },
        'logout': {
          name: 'logout',
          post: function(req, res) {
            req.logout();
            return res.redirect('/');
          }
        }
      }
    }
  }
};
