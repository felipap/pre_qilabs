var Activity, Inbox, Notification, ObjectId, Post, Resource, mongoose, required, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

_ = require('underscore');

ObjectId = mongoose.Types.ObjectId;

required = require('../lib/required.js');

Activity = mongoose.model('Activity');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

Resource = mongoose.model('Resource');

Post = Resource.model('Post');

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
      get: function(req, res) {
        var maxDate;
        if (isNaN(maxDate = parseInt(req.query.maxDate))) {
          maxDate = Date.now();
        }
        return req.user.getTimeline({
          maxDate: maxDate
        }, req.handleErrResult(function(docs, minDate) {
          if (minDate == null) {
            minDate = -1;
          }
          return res.endJson({
            minDate: minDate,
            data: docs
          });
        }));
      },
      post: function(req, res) {
        var _ref;
        if (_ref = !req.body.type, __indexOf.call(_.values(Post.Types), _ref) >= 0) {
          console.log('typo', req.body.type, 'invalido', _.values(Post.Types));
          return res.endJSON({
            error: true,
            type: 'InvalidPostType'
          });
        }
        return req.user.createPost({
          groupId: null,
          type: req.body.type,
          content: {
            title: req.body.content.title,
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
