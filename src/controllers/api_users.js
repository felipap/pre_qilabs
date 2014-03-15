var Post, Resource, User, mongoose, required;

mongoose = require('mongoose');

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

module.exports = {
  children: {
    ':userId/posts': {
      methods: {
        get: [
          required.login, function(req, res) {
            var opts, userId;
            if (!(userId = req.paramToObjectId('userId'))) {
              return;
            }
            opts = {
              limit: 5
            };
            if (parseInt(req.query.maxDate)) {
              opts.maxDate = parseInt(req.query.maxDate);
            }
            return User.getPostsFromUser(userId, opts, req.handleErrResult(function(docs, minDate) {
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
            }, req.handleErrResult(function(user) {
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
};
