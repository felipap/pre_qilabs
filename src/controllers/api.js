
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
var Activity, Follow, Group, Inbox, Notification, ObjectId, Post, Resource, Subscriber, Tag, User, mongoose, required, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

_ = require('underscore');

ObjectId = mongoose.Types.ObjectId;

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

Tag = mongoose.model('Tag');

Inbox = mongoose.model('Inbox');

Group = Resource.model('Group');

Follow = Resource.model('Follow');

Activity = mongoose.model('Activity');

Subscriber = mongoose.model('Subscriber');

Notification = mongoose.model('Notification');

module.exports = {
  children: {
    'session': require('./api_session'),
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
    'labs': require('./api_labs'),
    'posts': require('./api_posts'),
    'users': require('./api_users'),
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
            return req.user.getNotifications(req.handleErrResult(function(notes) {
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
            }, req.handleErrResult(function(doc) {
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
            return req.user.getTimeline(opts, req.handleErrResult(function(docs) {
              var minDate;
              if (docs.length === opts.limit) {
                minDate = docs[docs.length - 1].published.valueOf();
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
