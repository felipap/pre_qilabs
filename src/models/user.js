
/*
GUIDELINES for development:
- Never utilize directly request parameters or data.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
 */
var Follow, Inbox, ObjectId, Post, User, UserSchema, async, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

async = require('async');

Inbox = mongoose.model('Inbox');

Follow = mongoose.model('Follow');

Post = mongoose.model('Post');

ObjectId = mongoose.Types.ObjectId;

UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  tags: Array,
  facebookId: String,
  accessToken: String,
  notifiable: {
    type: Boolean,
    "default": true
  },
  lastUpdate: {
    type: Date,
    "default": Date(0)
  },
  firstAccess: Date,
  contact: {
    email: String
  },
  profile: {
    fullName: '',
    birthday: Date,
    city: '',
    avatarUrl: ''
  },
  badges: [],
  followingTags: []
}, {
  id: true
});

UserSchema.virtual('avatarUrl').get(function() {
  return 'https://graph.facebook.com/' + this.facebookId + '/picture';
});

UserSchema.virtual('profileUrl').get(function() {
  return '/p/' + this.username;
});

UserSchema.methods.getFollowers = function(cb) {
  return Follow.find({
    followee: this.id
  }, function(err, docs) {
    console.log('found follow relationships:', _.pluck(docs, 'follower'));
    return User.find({
      _id: {
        $in: _.pluck(docs, 'follower')
      }
    }, function(err, docs) {
      return cb(err, docs);
    });
  });
};

UserSchema.methods.getFollowing = function(cb) {
  return Follow.find({
    follower: this.id
  }, function(err, docs) {
    return User.find({
      _id: {
        $in: _.pluck(docs, 'followee')
      }
    }, function(err, docs) {
      return cb(err, docs);
    });
  });
};

UserSchema.methods.countFollowers = function(cb) {
  return Follow.count({
    followee: this.id
  }, function(err, count) {
    return cb(err, count);
  });
};

UserSchema.methods.doesFollowId = function(userId, cb) {
  if (!userId) {
    cb(true);
  }
  return Follow.findOne({
    followee: userId,
    follower: this.id
  }, function(err, doc) {
    return cb(err, !!doc);
  });
};

UserSchema.methods.followId = function(userId, cb) {
  if (!userId) {
    cb(true);
  }
  return Follow.findOne({
    follower: this.id,
    followee: userId
  }, function(err, doc) {
    if (!doc) {
      doc = new Follow({
        follower: this.id,
        followee: userId
      });
      doc.save();
    }
    console.log("Now following:", err, doc);
    return cb(err, !!doc);
  });
};

UserSchema.methods.unfollowId = function(userId, cb) {
  return Follow.findOne({
    follower: this.id,
    followee: userId
  }, function(err, doc) {
    console.log("Now unfollowing:", err, doc);
    return doc.remove(function(err, num) {
      return cb(err, !!num);
    });
  });
};

UserSchema.methods.getTimeline = function(opts, cb) {
  return Inbox.find({
    recipient: this.id
  }).sort('-dateSent').populate('post').select('post').limit(opts.limit || 10).skip(opts.skip || 0).exec(function(err, inboxes) {
    if (err) {
      return cb(err);
    }
    return User.populate(inboxes, {
      path: 'post.author'
    }, function(err, docs) {
      var results;
      if (err) {
        return cb(err);
      }
      results = [];
      docs = _.filter(_.pluck(docs, 'post'), function(i) {
        return i;
      });
      return async.forEach(docs, function(post, asyncCb) {
        return Post.find({
          parentPost: post
        }).populate('author').exec(function(err, comments) {
          console.log('post', post);
          results.push(_.extend({}, post.toObject(), {
            comments: comments
          }));
          return asyncCb();
        });
      }, function(err) {
        return cb(err, results);
      });
    });
  });
};

UserSchema.statics.getPostsFromUser = function(userId, opts, cb) {
  return Post.find({
    author: userId,
    parentPost: null
  }).sort('-dateCreated').populate('author').limit(opts.limit || 10).skip(opts.skip || null).exec(function(err, docs) {
    var d, results;
    if (err) {
      return cb(err);
    }
    results = [];
    console.log('moar', docs, [
      (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          d = docs[_i];
          _results.push(d);
        }
        return _results;
      })() ? d : void 0
    ]);
    return async.forEach(_.filter(d, function(i) {
      return i;
    }), function(post, asyncCb) {
      return Post.find({
        parentPost: post
      }).populate('author').exec(function(err, comments) {
        console.log('post', post);
        results.push(_.extend({}, post.toObject(), {
          comments: comments
        }));
        return asyncCb();
      });
    }, function(err) {
      return cb(err, results);
    });
  });
};

UserSchema.statics.getPostsToUser = function(userId, opts, cb) {
  return Post.find({
    author: userId,
    parentPost: null
  }).sort('-dateCreated').populate('author').exec(function(err, posts) {
    console.log('posts', posts);
    return cb(err, posts);
  });
};


/*
Create a post object with type comment.
 */

UserSchema.methods.commentToPost = function(parentPost, data, cb) {
  var post;
  post = new Post({
    author: this,
    group: null,
    data: {
      body: data.content.body
    },
    parentPost: parentPost,
    postType: Post.PostTypes.Comment
  });
  return post.save(cb);
};


/*
Generate stuffed profile for the controller.
 */

UserSchema.methods.genProfile = function(cb) {
  return this.getFollowers((function(_this) {
    return function(err, followers) {
      if (err) {
        return cb(err);
      }
      return _this.getFollowing(function(err, following) {
        if (err) {
          return cb(err);
        }
        return cb(null, _.extend(this, {
          followers: followers,
          following: following
        }));
      });
    };
  })(this));
};

UserSchema.methods.createGroup = function(data) {};


/*
Create a post object and fan out through inboxes.
 */

UserSchema.methods.createPost = function(data, cb) {
  var post;
  post = new Post({
    author: this.id,
    data: {
      title: data.content.title,
      body: data.content.body
    }
  });
  if (data.groupId) {
    post.group = data.groupId;
  }
  return post.save((function(_this) {
    return function(err, post) {
      console.log('yes, here', err, post);
      cb(err, post);
      if (post.group) {
        return;
      }
      return _this.getFollowers(function(err, docs) {
        var follower, _i, _len, _results;
        Inbox.create({
          author: _this.id,
          recipient: _this.id,
          post: post
        }, function() {});
        _results = [];
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          follower = docs[_i];
          _results.push(Inbox.create({
            author: _this.id,
            recipient: follower.id,
            post: post
          }, function() {}));
        }
        return _results;
      });
    };
  })(this));
};

UserSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = User = mongoose.model("User", UserSchema);
