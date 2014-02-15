
/*
GUIDELINES for development:
- Never utilize directly request parameters or data.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
 */
var Follow, Inbox, ObjectId, Post, User, UserSchema, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

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
  portfolio: {
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
  }).sort('-dateSent').populate('post').select('post').limit(opts.limit || 10).skip(opts.skip || null).exec(function(err, inboxes) {
    if (err) {
      return cb(err);
    }
    return User.populate(inboxes, {
      path: 'post.author'
    }, function(err, docs) {
      var count, post, posts, results, _i, _len, _results;
      if (err) {
        return cb(err);
      }
      posts = _.pluck(docs, 'post');
      results = [];
      count = 0;
      _results = [];
      for (_i = 0, _len = posts.length; _i < _len; _i++) {
        post = posts[_i];
        if (!(post)) {
          continue;
        }
        count++;
        _results.push((function(post) {
          return Post.find({
            parentPost: post
          }).populate('author').exec(function(err, comments) {
            results.push(_.extend({}, post.toObject(), {
              comments: comments
            }));
            if (!--count) {
              return cb(false, results);
            }
          });
        })(post));
      }
      return _results;
    });
  });
};

UserSchema.statics.getPostsFromUser = function(userId, opts, cb) {
  return Post.find({
    author: userId,
    parentPost: null
  }).sort('-dateCreated').populate('author').limit(opts.limit || 10).skip(opts.skip || null).exec(function(err, posts) {
    console.log('posts', posts);
    return cb(err, posts);
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
Generate stuffed profile for the controller.
 */

UserSchema.statics.genProfileFromUsername = function(username, cb) {
  return User.findOne({
    username: username
  }, function(err, doc) {
    if (err || !doc) {
      return cb(err);
    }
    if (!doc) {
      return cb(null, doc);
    }
    return doc.getFollowers(function(err, followers) {
      if (err) {
        return cb(err);
      }
      return doc.getFollowing(function(err, following) {
        if (err) {
          return cb(err);
        }
        return cb(null, _.extend(doc, {
          followers: followers,
          following: following
        }));
      });
    });
  });
};

UserSchema.statics.genProfileFromModel = function(userModel, cb) {
  return userModel.getFollowers(function(err, followers) {
    if (err) {
      return cb(err);
    }
    return userModel.getFollowing(function(err, following) {
      if (err) {
        return cb(err);
      }
      return cb(null, _.extend(userModel, {
        followers: followers,
        following: following
      }));
    });
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
Create a post object and fan out through inboxes.
 */

UserSchema.methods.createPost = function(data, cb) {
  var post;
  post = new Post({
    author: this.id,
    group: null,
    data: {
      title: data.content.title,
      body: data.content.body
    }
  });
  return post.save((function(_this) {
    return function(err, post) {
      console.log('yes, here', err, post);
      cb(err, post);
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
