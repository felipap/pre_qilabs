var Notification, ObjectId, Post, PostSchema, Resource, Types, assert, assertArgs, async, mongoose, notifyUser, urlify, _;

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
  VideoPost: 'VideoPost',
  Notification: 'Notification'
};

PostSchema = new mongoose.Schema({
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
  dateCreated: {
    type: Date,
    indexed: 1
  },
  type: {
    type: String,
    required: true
  },
  parentPost: {
    type: ObjectId,
    ref: 'Post',
    required: false
  },
  data: {
    title: {
      type: String,
      required: false
    },
    body: {
      type: String,
      required: true
    },
    tags: {
      type: Array
    }
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
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

urlify = function(text) {
  var urlRegex;
  urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
  return text.replace(urlRegex, function(url) {
    return "<a href=\"" + url + "\">" + url + "</a>";
  });
};

PostSchema.virtual('data.unescapedBody').get(function() {
  return urlify(this.data.body);
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

PostSchema.pre('remove', function(next) {
  next();
  return Notification.find({
    resources: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs.length + " notifications of post " + _this.id);
      return docs.forEach(function(doc) {
        return doc.remove();
      });
    };
  })(this));
});

PostSchema.pre('save', function(next) {
  if (this.dateCreated == null) {
    this.dateCreated = new Date;
  }
  return next();
});

PostSchema.methods.getComments = function(cb) {
  return Post.find({
    parentPost: this.id
  }).populate('author').exec(function(err, docs) {
    return cb(err, docs);
  });
};

PostSchema.methods.stuff = function(cb) {
  return this.populate('author', function(err, doc) {
    if (err) {
      return cb(err);
    } else if (doc) {
      return doc.fillComments(cb);
    } else {
      return cb(false, null);
    }
  });
};

PostSchema.methods.fillComments = function(cb) {
  var _ref;
  if ((_ref = this.type) !== 'PlainPost' && _ref !== 'Answer') {
    cb(false, this.toJSON());
  }
  return Post.find({
    parentPost: this,
    type: Post.Types.Comment
  }).populate('author').exec((function(_this) {
    return function(err, comments) {
      return cb(err, _.extend({}, _this.toJSON(), {
        comments: comments
      }));
    };
  })(this));
};

notifyUser = function(recpObj, agentObj, data, cb) {
  var User, note;
  assertArgs({
    ismodel: 'User'
  }, {
    ismodel: 'User'
  }, {
    contains: ['url', 'type']
  });
  User = mongoose.model('User');
  note = new Post({
    agent: agentObj,
    agentName: agentObj.name,
    recipient: recpObj,
    type: data.type,
    url: data.url,
    thumbnailUrl: data.thumbnailUrl || agentObj.avatarUrl
  });
  if (data.resources) {
    note.resources = data.resources;
  }
  return note.save(function(err, doc) {
    return typeof cb === "function" ? cb(err, doc) : void 0;
  });
};

PostSchema.statics.Trigger = function(agentObj, type) {
  var User;
  User = mongoose.model('User');
  switch (type) {
    case Types.NewFollower:
      return function(followerObj, followeeObj, cb) {
        if (cb == null) {
          cb = function() {};
        }
        return Post.findOne({
          type: Types.NewFollower,
          agent: followerObj,
          recipient: followeeObj
        }, function(err, doc) {
          if (doc) {
            doc.remove(function() {});
          }
          return notifyUser(followeeObj, followerObj, {
            type: Types.NewFollower,
            url: followerObj.profileUrl
          }, cb);
        });
      };
  }
};

PostSchema.statics.fillComments = function(docs, cb) {
  var results;
  assert(docs, "Can't fill comments of invalid post(s) document.");
  results = [];
  return async.forEach(_.filter(docs, function(i) {
    return i;
  }), function(post, done) {
    return Post.find({
      parentPost: post,
      type: Post.Types.Comment
    }).populate('author').exec(function(err, comments) {
      if (post.toObject) {
        results.push(_.extend({}, post.toObject(), {
          comments: comments
        }));
      } else {
        results.push(_.extend({}, post, {
          comments: comments
        }));
      }
      return done();
    });
  }, function(err) {
    if (err) {
      console.log('Error in fillinpostcomments', err);
    }
    return cb(err, results);
  });
};

PostSchema.statics.Types = Types;

PostSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Post = Resource.discriminator('Post', PostSchema);
