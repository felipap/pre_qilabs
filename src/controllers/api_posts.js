var Group, Post, Resource, User, mongoose, required;

mongoose = require('mongoose');

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

Group = mongoose.model('Group');

module.exports = {
  permissions: [required.login],
  children: {
    '/:id': {
      get: function(req, res) {
        var postId;
        if (!(postId = req.paramToObjectId('id'))) {
          return;
        }
        return Post.findOne({
          _id: postId
        }, req.handleErrResult((function(_this) {
          return function(doc) {
            return doc.fillComments(function(err, object) {
              return res.endJson({
                error: false,
                data: object
              });
            });
          };
        })(this)));
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
        }, req.handleErrResult(function(doc) {
          doc.remove();
          return res.endJson(doc);
        }));
      },
      children: {
        '/comments': {
          methods: {
            get: [
              required.posts.selfCanSee('id'), function(req, res) {
                var postId;
                if (!(postId = req.paramToObjectId('id'))) {
                  return;
                }
                return Post.findById(postId).populate('author').exec(req.handleErrResult(function(post) {
                  return post.getComments(req.handleErrResult((function(_this) {
                    return function(comments) {
                      return res.endJson({
                        data: comments,
                        error: false,
                        page: -1
                      });
                    };
                  })(this)));
                }));
              }
            ],
            post: [
              required.posts.selfCanComment('id'), function(req, res) {
                var data, postId;
                if (!(postId = req.paramToObjectId('id'))) {
                  return;
                }
                data = {
                  content: {
                    body: req.body.content.body
                  }
                };
                return Post.findById(postId, req.handleErrResult((function(_this) {
                  return function(parentPost) {
                    return req.user.commentToPost(parentPost, data, req.handleErrResult(function(doc) {
                      return doc.populate('author', req.handleErrResult(function(doc) {
                        return res.endJson({
                          error: false,
                          data: doc
                        });
                      }));
                    }));
                  };
                })(this)));
              }
            ]
          }
        }
      }
    }
  }
};
