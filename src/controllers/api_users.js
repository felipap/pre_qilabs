var Post, Resource, User, mongoose, required;

mongoose = require('mongoose');

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

User = mongoose.model('User');

Post = Resource.model('Post');

module.exports = {
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
            }, res.handleErrResult(function(docs) {
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
            }, res.handleErrResult(function(user) {
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
