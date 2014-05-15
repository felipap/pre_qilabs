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
        function(req, res) {
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
      put: [
        required.posts.selfOwns('id'), function(req, res) {
          var postId, sanitizer;
          if (!(postId = req.paramToObjectId('id'))) {
            return;
          }
          sanitizer = require('sanitizer');
          console.log(req.body.data.body);
          console.log('final:', req.body.tags, sanitizer.sanitize(req.body.data.body));
          return Post.findById(postId, req.handleErrResult((function(_this) {
            return function(post) {
              post.data.body = sanitizer.sanitize(req.body.data.body);
              return post.save(req.handleErrResult(function(me) {
                return post.stuff(req.handleErrResult(function(stuffedPost) {
                  return res.endJson(stuffedPost);
                }));
              }));
            };
          })(this)));
        }
      ],
      "delete": [
        required.posts.selfOwns('id'), function(req, res) {
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
        }
      ],
      children: {
        '/delete': {
          get: [
            required.posts.selfOwns('id'), function(req, res) {
              var postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              return Post.findOne({
                _id: postId
              }, req.handleErrResult(function(doc) {
                doc.remove();
                return res.endJson(doc);
              }));
            }
          ]
        },
        '/upvote': {
          post: [
            required.posts.selfDoesntOwn('id'), function(req, res) {
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
            required.posts.selfDoesntOwn('id'), function(req, res) {
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
              var data, htmlEntities, postId;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              htmlEntities = function(str) {
                return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
              };
              data = {
                content: {
                  body: htmlEntities(req.body.content.body)
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
              var data, postId, sanitizer;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              sanitizer = require('sanitizer');
              console.log(req.body.body);
              console.log('final:', req.body.tags, sanitizer.sanitize(req.body.body));
              data = {
                content: {
                  body: sanitizer.sanitize(req.body.body)
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
