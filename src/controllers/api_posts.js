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
      get: [
        required.posts.selfCanSee('id'), function(req, res) {
          var postId;
          if (!(postId = req.paramToObjectId('id'))) {
            return;
          }
          return Post.findOne({
            _id: postId
          }, req.handleErrResult(function(post) {
            return post.stuff(req.handleErrResult(function(stuffedPost) {
              return res.endJson({
                data: stuffedPost
              });
            }));
          }));
        }
      ],
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
        '/upvote': {
          post: [
            required.posts.selfCanComment('id'), function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return Post.findById(postId, req.handleErrResult((function(_this) {
                return function(post) {
                  return req.user.upvotePost(post, function(err, doc) {
                    return res.endJson({
                      err: err,
                      data: doc
                    });
                  });
                };
              })(this)));
            }
          ]
        },
        '/unupvote': {
          post: [
            required.posts.selfCanComment('id'), function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return Post.findById(postId, req.handleErrResult((function(_this) {
                return function(post) {
                  return req.user.unupvotePost(post, function(err, doc) {
                    return res.endJson({
                      err: err,
                      data: doc
                    });
                  });
                };
              })(this)));
            }
          ]
        },
        '/comments': {
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
                },
                type: Post.Types.Comment
              };
              return Post.findById(postId, req.handleErrResult((function(_this) {
                return function(parentPost) {
                  return req.user.postToParentPost(parentPost, data, req.handleErrResult(function(doc) {
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
        },
        '/answers': {
          post: [
            required.posts.selfCanComment('id'), function(req, res) {
              var data, postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              data = {
                content: {
                  body: req.body.content.body
                },
                type: Post.Types.Answer
              };
              return Post.findById(postId, req.handleErrResult((function(_this) {
                return function(parentPost) {
                  return req.user.postToParentPost(parentPost, data, req.handleErrResult(function(doc) {
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
};
