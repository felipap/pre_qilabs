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
  children: {
    'profile': {
      put: function(req, res) {
        var bio, home, location;
        console.log('profile received', req.body.profile);
        bio = req.body.profile.bio.replace(/^\s+|\s+$/g, '');
        home = req.body.profile.home.replace(/^\s+|\s+$/g, '');
        location = req.body.profile.location.replace(/^\s+|\s+$/g, '');
        if (bio) {
          req.user.profile.bio = bio;
        }
        if (home) {
          req.user.profile.home = home;
        }
        if (location) {
          req.user.profile.location = location;
        }
        req.user.save(function() {});
        return res.endJson({
          error: false
        });
      }
    },
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
        var sanitizer, tag, tags, _ref;
        sanitizer = require('sanitizer');
        console.log(req.body.body);
        console.log('final:', req.body.tags, sanitizer.sanitize(req.body.body));
        tags = (function() {
          var _i, _len, _ref, _results;
          _ref = req.body.tags;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            tag = _ref[_i];
            if (__indexOf.call(_.pluck(req.app.locals.tags, 'id'), tag) >= 0) {
              _results.push(tag);
            }
          }
          return _results;
        })();
        console.log(req.body.tags, tags, req.app.locals.tags, _.pluck(req.app.locals.tags, 'id'));
        if (!req.body.title) {
          res.endJson({
            error: true,
            name: 'empty title'
          });
        }
        if (!req.body.body) {
          res.endJson({
            error: true,
            name: 'empty body'
          });
        }
        if ((_ref = !req.body.type.toLowerCase()) === 'question' || _ref === 'tip' || _ref === 'experience') {
          res.endJson({
            error: true,
            name: 'wtf type'
          });
        }
        return req.user.createPost({
          groupId: null,
          type: req.body.type.toLowerCase(),
          content: {
            title: req.body.title,
            body: sanitizer.sanitize(req.body.body)
          },
          tags: tags
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
    'logout': {
      name: 'logout',
      post: function(req, res) {
        req.logout();
        return res.redirect('/');
      }
    }
  }
};
