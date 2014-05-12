var Post, Resource, User, mongoose, required;

mongoose = require('mongoose');

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

module.exports = {
  children: {
    ':userId': {
      children: {
        '/posts': {
          get: [
            required.login, function(req, res) {
              var maxDate, userId;
              if (!(userId = req.paramToObjectId('userId'))) {
                return;
              }
              if (isNaN(maxDate = parseInt(req.query.maxDate))) {
                maxDate = Date.now();
              }
              return User.findOne({
                _id: userId
              }, req.handleErrResult(function(user) {
                return User.getUserTimeline(user, {
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
              }));
            }
          ]
        },
        '/followers': {
          get: [
            required.login, function(req, res) {
              var userId;
              if (!(userId = req.paramToObjectId('userId'))) {
                return;
              }
              return User.findOne({
                _id: userId
              }, req.handleErrResult(function(user) {
                return user.getPopulatedFollowers(function(err, results) {
                  if (err) {
                    return res.endJson(err);
                  } else {
                    return res.endJson({
                      data: results
                    });
                  }
                });
              }));
            }
          ]
        },
        '/following': {
          get: [
            required.login, function(req, res) {
              var userId;
              if (!(userId = req.paramToObjectId('userId'))) {
                return;
              }
              return User.findOne({
                _id: userId
              }, req.handleErrResult(function(user) {
                return user.getPopulatedFollowing(function(err, results) {
                  if (err) {
                    return res.endJson(err);
                  } else {
                    return res.endJson({
                      data: results
                    });
                  }
                });
              }));
            }
          ]
        },
        '/follow': {
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
        },
        '/unfollow': {
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
  }
};
