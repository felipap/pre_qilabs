var Post, Resource, Tag, User, mongoose, required;

mongoose = require('mongoose');

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

User = mongoose.model('User');

Post = Resource.model('Post');

Tag = mongoose.model('Tag');

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
        }, res.handleErrResult(function(doc) {
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
        }, res.handleErrResult(function(doc) {
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
              return Post.findById(postId).populate('author').exec(res.handleErrResult(function(post) {
                return post.getComments(res.handleErrResult(function(comments) {
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
              return Post.findById(postId, res.handleErrResult((function(_this) {
                return function(parentPost) {
                  return req.user.commentToPost(parentPost, data, res.handleErrResult(function(doc) {
                    return doc.populate('author', res.handleErrResult(function(doc) {
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
};
