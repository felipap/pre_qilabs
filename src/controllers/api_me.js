var Activity, Inbox, Notification, Post, Resource, mongoose, required;

mongoose = require('mongoose');

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
        bio = req.body.profile.bio.replace(/^\s+|\s+$/g, '').slice(0, 300);
        home = req.body.profile.home.replace(/^\s+|\s+$/g, '').slice(0, 35);
        location = req.body.profile.location.replace(/^\s+|\s+$/g, '').slice(0, 35);
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
