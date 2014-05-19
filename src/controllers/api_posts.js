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
    var body, data, sanitizer, tag, tags, title, type, _ref;
    sanitizer = require('sanitizer');
    data = req.body;
    console.log('Checking type');
    if (_ref = !data.type.toLowerCase(), __indexOf.call(_.keys(req.app.locals.postTypes), _ref) >= 0) {
      return res.status(400).endJson({
        error: true,
        message: 'Tipo de publicação inválido.'
      });
    }
    type = data.type[0].toUpperCase() + data.type.slice(1).toLowerCase();
    console.log('Checking tags');
    if (!data.tags || !data.tags instanceof Array) {
      return res.status(400).endJson({
        error: true,
        message: 'Selecione pelo menos um assunto relacionado a esse post.'
      });
    }
    tags = (function() {
      var _i, _len, _ref1, _results;
      _ref1 = data.tags;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        tag = _ref1[_i];
        if (__indexOf.call(_.keys(req.app.locals.getTagMap()), tag) >= 0) {
          _results.push(tag);
        }
      }
      return _results;
    })();
    if (tags.length === 0) {
      return res.status(400).endJson({
        error: true,
        message: 'Selecione pelo menos um assunto relacionado a esse post.'
      });
    }
    console.log('Checking title');
    if (!data.data.title || !data.data.title.length) {
      return res.status(400).endJson({
        error: true,
        message: 'Erro! Cadê o título da sua ' + req.app.locals.postTypes[type].translated + '?'
      });
    }
    if (data.data.title.length < 10) {
      return res.status(400).endJson({
        error: true,
        message: 'Hm... Esse título é muito pequeno. Escreva um com no mínimo 10 caracteres, ok?'
      });
    }
    if (data.data.title.length < 10) {
      return res.status(400).endJson({
        error: true,
        message: 'Hmm... esse título é muito grande. Escreva um com até 100 caracteres.'
      });
    }
    title = data.data.title;
    if (!data.data.body) {
      return res.status(400).endJson({
        error: true,
        message: 'Escreva um corpo para a sua publicação.'
      });
    }
    if (data.data.body.length > 20 * 1000) {
      return res.status(400).endJson({
        error: true,
        message: 'Erro! Você escreveu tudo isso?'
      });
    }
    body = sanitizer.sanitize(data.data.body, function(uri) {
      return uri;
    });
    data = {
      type: type,
      tags: tags,
      content: {
        title: title,
        body: body
      }
    };
    console.log('Final:', data);
    return req.user.createPost(data, req.handleErrResult(function(doc) {
      return doc.populate('author', function(err, doc) {
        return res.endJson(doc);
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
            var _ref;
            if ((_ref = doc.type) !== 'Answer' && _ref !== 'Comment') {
              req.user.update({
                $inc: {
                  'stats.posts': -1
                }
              }, function() {
                return console.log(arguments);
              });
            }
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
              data = {
                content: {
                  body: sanitizer.sanitize(req.body.body, function(uri) {
                    return uri;
                  })
                },
                type: Post.Types.Answer
              };
              console.log('final data:', data);
              return Post.findById(postId, req.handleErrResult((function(_this) {
                return function(parentPost) {
                  return req.user.postToParentPost(parentPost, data, req.handleErrResult(function(doc) {
                    return doc.populate('author', req.handleErrResult(function(doc) {
                      return res.endJson(data);
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
