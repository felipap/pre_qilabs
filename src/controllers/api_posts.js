var Group, Post, Resource, User, defaultSanitizerOptions, getValidPostData, mongoose, required, sanitizerOptions, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

_ = require('underscore');

User = Resource.model('User');

Post = Resource.model('Post');

Group = mongoose.model('Group');

defaultSanitizerOptions = {
  allowedTags: ['h1', 'h2', 'b', 'em', 'strong', 'a', 'img', 'u', 'ul', 'blockquote'],
  allowedAttributes: {
    'a': ['href'],
    'img': ['src']
  },
  transformTags: {
    'div': 'span'
  },
  exclusiveFilter: function(frame) {
    var _ref;
    return ((_ref = frame.tag) === 'a' || _ref === 'span') && !frame.text.trim();
  }
};

sanitizerOptions = {
  'Question': _.extend(defaultSanitizerOptions, {
    allowedTags: ['b', 'em', 'strong', 'a', 'u', 'ul', 'blockquote']
  }),
  'Tip': defaultSanitizerOptions,
  'Experience': defaultSanitizerOptions
};

getValidPostData = function(data, app) {
  var body, sanitizer, tag, tags, title;
  if (!data.tags || !data.tags instanceof Array) {
    res.status(400).endJson({
      error: true,
      msg: 'Selecione pelo menos um assunto relacionado a esse post.'
    });
    return null;
  }
  tags = (function() {
    var _i, _len, _ref, _results;
    _ref = data.tags;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      tag = _ref[_i];
      if (__indexOf.call(_.keys(app.locals.getTagMap()), tag) >= 0) {
        _results.push(tag);
      }
    }
    return _results;
  })();
  if (tags.length === 0) {
    res.status(400).endJson({
      error: true,
      msg: 'Selecione pelo menos um assunto relacionado a esse post.'
    });
    return null;
  }
  if (!data.data.title || !data.data.title.length) {
    res.status(400).endJson({
      error: true,
      msg: 'Erro! Cadê o título da sua ' + app.locals.postTypes[type].translated + '?'
    });
    return null;
  }
  if (data.data.title.length < 10) {
    res.status(400).endJson({
      error: true,
      msg: 'Hm... Esse título é muito pequeno. Escreva um com no mínimo 10 caracteres, ok?'
    });
    return null;
  }
  if (data.data.title.length > 100) {
    res.status(400).endJson({
      error: true,
      msg: 'Hmm... esse título é muito grande. Escreva um com até 100 caracteres.'
    });
    return null;
  }
  title = data.data.title;
  if (!data.data.body) {
    res.status(400).endJson({
      error: true,
      msg: 'Escreva um corpo para a sua publicação.'
    });
    return null;
  }
  if (data.data.body.length > 20 * 1000) {
    res.status(400).endJson({
      error: true,
      msg: 'Erro! Você escreveu tudo isso?'
    });
    return null;
  }
  sanitizer = require('sanitize-html');
  body = sanitizer(data.data.body, sanitizerOptions[type]);
  return {
    tags: tags,
    title: title,
    body: body
  };
};

module.exports = {
  permissions: [required.login],
  post: function(req, res) {
    var data, sanitized, type, _ref;
    data = req.body;
    console.log('Checking type');
    if (_ref = !data.type.toLowerCase(), __indexOf.call(_.keys(req.app.locals.postTypes), _ref) >= 0) {
      return res.status(400).endJson({
        error: true,
        msg: 'Tipo de publicação inválido.'
      });
    }
    type = data.type[0].toUpperCase() + data.type.slice(1).toLowerCase();
    if (!(sanitized = getValidPostData(req.body, req.app))) {
      return;
    }
    console.log('Final:', sanitized);
    return req.user.createPost({
      type: type,
      tags: sanitized.tags,
      content: {
        title: sanitized.title,
        body: sanitized.body
      }
    }, req.handleErrResult(function(doc) {
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
              var sanitized;
              if (post.type === 'Comment') {
                return res.endJson({
                  error: true,
                  msg: ''
                });
              }
              if (!(sanitized = getValidData(req.body, req.app))) {
                return;
              }
              post.tags = sanitized.tags;
              post.data.title = sanitized.title;
              post.data.body = sanitized.body;
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
              var body, data, postId, sanitizer;
              if (!(postId = req.paramToObjectId('id'))) {
                return;
              }
              sanitizer = require('sanitize-html');
              body = sanitizer(req.body.body, {
                allowedTags: ['h1', 'h2', 'b', 'em', 'strong', 'a', 'img', 'u', 'ul', 'blockquote'],
                allowedAttributes: {
                  'a': ['href'],
                  'img': ['src']
                },
                transformTags: {
                  'div': 'span'
                },
                exclusiveFilter: function(frame) {
                  var _ref;
                  return ((_ref = frame.tag) === 'a' || _ref === 'span') && !frame.text.trim();
                }
              });
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
                      return res.endJson(doc);
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
