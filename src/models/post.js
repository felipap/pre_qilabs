var Inbox, Notification, Post, PostSchema, Types, assert, async, hookedModel, mongoose, urlify, _;

mongoose = require('mongoose');

assert = require('assert');

_ = require('underscore');

async = require('async');

hookedModel = require('./lib/hookedModel');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

Types = {
  Comment: 'Comment',
  Answer: 'Answer',
  PlainPost: 'PlainPost',
  VideoPost: 'VideoPost',
  Notification: 'Notification'
};

PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group'
  },
  dateCreated: {
    type: Date
  },
  type: {
    type: String,
    "default": Types.PlainPost,
    required: true
  },
  parentPost: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    index: 1
  },
  points: {
    type: Number,
    "default": 0
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
      return Post.fillInComments(doc, cb);
    } else {
      return cb(false, null);
    }
  });
};

PostSchema.statics.fillInComments = function(docs, cb) {
  var post, results;
  assert(docs, "Can't fill comments of invalid post(s) document.");
  if (docs instanceof Array) {
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
  } else {
    console.log('second option');
    post = docs;
    return Post.find({
      parentPost: post,
      type: Post.Types.Comment
    }).populate('author').exec(function(err, comments) {
      if (post.toObject) {
        return cb(err, _.extend({}, post.toObject(), {
          comments: comments
        }));
      } else {
        return cb(err, _.extend({}, post, {
          comments: comments
        }));
      }
    });
  }
};

PostSchema.statics.Types = Types;

PostSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = Post = hookedModel("Post", PostSchema);
