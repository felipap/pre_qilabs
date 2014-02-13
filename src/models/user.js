var Follow, Inbox, Post, User, UserSchema, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

Inbox = mongoose.model('Inbox');

Follow = mongoose.model('Follow');

Post = mongoose.model('Post');

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
  return Follow.findOneAndUpdate({
    follower: this.id,
    followee: userId
  }, {}, {
    upsert: true
  }, function(err, doc) {
    console.log("Now following:", err, doc);
    return cb(err, !!doc);
  });
};

UserSchema.methods.unfollowId = function(userId, cb) {
  return Follow.findOneAndRemove({
    follower: this.id,
    followee: userId
  }, function(err, doc) {
    console.log("Now unfollowing:", err, doc);
    return cb(err, !!doc);
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
      return cb(err, _.pluck(docs, 'post'));
    });
  });
};

UserSchema.statics.getPostsFromUser = function(userId, opts, cb) {
  return Post.find({
    author: userId
  }).sort('-dateCreated').populate('author').limit(opts.limit || 10).skip(opts.skip || null).exec(function(err, posts) {
    console.log('posts', posts);
    return cb(err, posts);
  });
};

UserSchema.statics.getPostsToUser = function(userId, opts, cb) {
  return Post.find({
    author: userId
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
    if (err) {
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

UserSchema.statics.genProfileFromModel = function(model, cb) {
  return model.getFollowers(function(err, followers) {
    if (err) {
      return cb(err);
    }
    return model.getFollowing(function(err, following) {
      if (err) {
        return cb(err);
      }
      return cb(null, _.extend(model, {
        followers: followers,
        following: following
      }));
    });
  });
};


/*
Create a post object and fan out through inboxes.
 */

UserSchema.methods.createPost = function(opts, cb) {
  return Post.create({
    author: this.id,
    group: null,
    data: {
      title: opts.content.title,
      body: opts.content.body
    }
  }, (function(_this) {
    return function(err, post) {
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
