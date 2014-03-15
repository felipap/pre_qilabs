var Activity, Follow, Group, Inbox, Notification, ObjectId, Post, Resource, Subscriber, User, mongoose, required, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

_ = require('underscore');

ObjectId = mongoose.Types.ObjectId;

required = require('../lib/required.js');

Activity = mongoose.model('Activity');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

Subscriber = mongoose.model('Subscriber');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

Group = Resource.model('Group');

Follow = Resource.model('Follow');

module.exports = {
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
          limit: 5
        };
        if (parseInt(req.query.maxDate)) {
          opts.maxDate = parseInt(req.query.maxDate);
        }
        return req.user.getTimeline(opts, req.handleErrResult(function(docs, minDate) {
          if (minDate == null) {
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
};
