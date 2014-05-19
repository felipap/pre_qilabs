var Group, Post, Resource, User, mongoose, required, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

_ = require('underscore');

User = Resource.model('User');

Post = Resource.model('Post');

Group = mongoose.model('Group');

module.exports = {
  permissions: [required.login],
  post: function(req, res) {
    var data, sanitizer, tag, tags, type, _ref;
    sanitizer = require('sanitizer');
    console.log(req.body);
    data = req.body;
    console.log('final:', data.tags, sanitizer.sanitize(data.data.body), 'porra');
    tags = (function() {
      var _i, _len, _ref, _results;
      _ref = data.tags;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        tag = _ref[_i];
        if (__indexOf.call(_.pluck(req.app.locals.getTags(), 'id'), tag) >= 0) {
          _results.push(tag);
        }
      }
      return _results;
    })();
    console.log(data.tags, tags, req.app.locals.getTags(), _.pluck(req.app.locals.getTags(), 'id'));
    if (!data.data.title) {
      return res.status(400).endJson({
        error: true,
        name: 'empty title'
      });
    }
    if (!data.data.body) {
      return res.status(400).endJson({
        error: true,
        name: 'empty body'
      });
    }
    if ((_ref = !data.type.toLowerCase()) === 'question' || _ref === 'tip' || _ref === 'experience') {
      return res.status(400).endJson({
        error: true,
        name: 'wtf type'
      });
    }
    type = data.type[0].toUpperCase() + data.type.slice(1).toLowerCase();
    return req.user.createPost({
      groupId: null,
      type: type,
      content: {
        title: data.data.title,
        body: sanitizer.sanitize(data.data.body)
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
  },
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
          var postId;
          if (!(postId = req.paramToObjectId('id'))) {
            return;
          }
          return Post.findById(postId, req.handleErrResult((function(_this) {
            return function(post) {
              var data, sanitizer, tag;
              if (post.type === 'Comment') {
                return res.endJson({
                  error: true,
                  message: ''
                });
              }
              sanitizer = require('sanitizer');
              data = req.body;
              console.log(data.data.body);
              console.log('final:', data.tags, sanitizer.sanitize(data.data.body));
              post.data.body = sanitizer.sanitize(data.data.body);
              post.tags = (function() {
                var _i, _len, _ref, _results;
                _ref = data.tags;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  tag = _ref[_i];
                  if (__indexOf.call(_.pluck(req.app.locals.getTags(), 'id'), tag) >= 0) {
                    _results.push(tag);
                  }
                }
                return _results;
              })();
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
                      error: err,
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
                      error: err,
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
