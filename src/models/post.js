var Notification, ObjectId, Post, PostSchema, Resource, Types, assert, assertArgs, async, mongoose, smallify, urlify, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

assert = require('assert');

_ = require('underscore');

async = require('async');

assertArgs = require('./lib/assertArgs');

ObjectId = mongoose.Schema.ObjectId;

Notification = mongoose.model('Notification');

Resource = mongoose.model('Resource');

Types = {
  Comment: 'Comment',
  Answer: 'Answer',
  PlainPost: 'PlainPost',
  QA: 'QA',
  VideoPost: 'VideoPost',
  Notification: 'Notification'
};

PostSchema = new Resource.Schema({
  author: {
    type: ObjectId,
    ref: 'User',
    required: true,
    indexed: 1
  },
  group: {
    type: ObjectId,
    ref: 'Group',
    required: false
  },
  type: {
    type: String,
    required: true,
    "enum": _.values(Types)
  },
  parentPost: {
    type: ObjectId,
    ref: 'Post',
    required: false
  },
  updated: {
    type: Date
  },
  published: {
    type: Date,
    indexed: 1
  },
  data: {
    title: {
      type: String,
      required: false
    },
    body: {
      type: String,
      required: true
    }
  },
  tags: [
    {
      type: String
    }
  ],
  votes: {
    type: [
      {
        type: String,
        ref: 'User',
        required: true
      }
    ],
    select: true,
    "default": []
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

PostSchema.virtual('voteSum').get(function() {
  return this.votes.length;
});

PostSchema.virtual('path').get(function() {
  if (this.parentPost) {
    return "/posts/" + this.parentPost + "#" + this.id;
  } else {
    return "/posts/{id}".replace(/{id}/, this.id);
  }
});

PostSchema.virtual('apiPath').get(function() {
  return "/api/posts/{id}".replace(/{id}/, this.id);
});

smallify = function(url) {
  if (url.length > 30) {
    return '...' + /https?:(?:\/\/)?[A-Za-z0-9][A-Za-z0-9\-]*([A-Za-z0-9\-]{2}\.[A-Za-z0-9\.\-]+(\/.{0,20})?)/.exec(url)[1] + '...';
  } else {
    return url;
  }
};

urlify = function(text) {
  var urlRegex;
  urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
  return text.replace(urlRegex, function(url) {
    return "<a href=\"" + url + "\">" + (smallify(url)) + "</a>";
  });
};

PostSchema.virtual('data.escapedBody').get(function() {
  return urlify(this.data.body);
});

PostSchema.pre('remove', function(next) {
  next();
  return Notification.find({
    resources: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs.length + " notifications of resource " + _this.id);
      return docs.forEach(function(doc) {
        return doc.remove();
      });
    };
  })(this));
});

PostSchema.pre('remove', function(next) {
  next();
  return Post.find({
    parentPost: this
  }, function(err, docs) {
    return docs.forEach(function(doc) {
      return doc.remove();
    });
  });
});

PostSchema.pre('save', function(next) {
  if (this.published == null) {
    this.published = new Date;
  }
  if (this.updated == null) {
    this.updated = new Date;
  }
  return next();
});

PostSchema.methods.getComments = function(cb) {
  return Post.find({
    parentPost: this.id
  }).populate('author', '-memberships').exec(function(err, docs) {
    return cb(err, docs);
  });
};

PostSchema.methods.stuff = function(cb) {
  return this.populate('author', function(err, doc) {
    if (err) {
      return cb(err);
    } else if (doc) {
      return doc.fillChildren(cb);
    } else {
      return cb(false, null);
    }
  });
};

PostSchema.methods.fillChildren = function(cb) {
  var self, _ref;
  self = this;
  if (_ref = this.type, __indexOf.call(_.values(Types), _ref) < 0) {
    return cb(false, this.toJSON());
  }
  return Post.find({
    parentPost: this
  }).populate('author').exec((function(_this) {
    return function(err, children) {
      return async.map(children, (function(c, done) {
        var _ref1;
        if ((_ref1 = c.type) === Types.Answer) {
          return Post.find({
            parentPost: c
          }).populate('author').exec(function(err, comments) {
            return done(err, _.extend({}, c.toJSON(), {
              comments: comments
            }));
          });
        } else {
          return done(null, c);
        }
      }), function(err, popChildren) {
        return cb(err, _.extend(self.toJSON(), {
          children: _.groupBy(popChildren, function(i) {
            return i.type;
          })
        }));
      });
    };
  })(this));
};

PostSchema.statics.stuffList = function(docs, cb) {
  assertArgs({
    $isA: Array
  }, '$isCb');
  return async.map(docs, function(post, done) {
    if (post instanceof Post) {
      return post.fillChildren(done);
    } else {
      return done(null, post);
    }
  }, function(err, results) {
    return cb(err, results);
  });
};

PostSchema.statics.Types = Types;

PostSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Post = Resource.discriminator('Post', PostSchema);
