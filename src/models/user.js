var Follow, Inbox, Post, User, UserSchema, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

Inbox = require('./inbox.js');

Follow = require('./follow.js');

Post = require('./post.js');

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

UserSchema.methods.getInbox = function(opts, cb) {
  return Inbox.getUserInbox(this, opts, cb);
};

UserSchema.methods.getBoard = function(opts, cb) {
  return Inbox.getUserBoard(this, opts, cb);
};

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
      console.log('found:', err, docs);
      return cb(err, docs);
    });
  });
};

UserSchema.methods.post = function(opts, cb) {
  return this.getFollowers((function(_this) {
    return function(err, docs) {
      var follower, _i, _len;
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        follower = docs[_i];
        Inbox.create({
          author: _this.id,
          recipient: follower.id,
          post: "Fala, " + follower.id + ". Como vai? Seguinte: " + opts
        }, function(err, doc) {
          return console.log('saved, really');
        });
      }
      return console.log(err, docs);
    };
  })(this));
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
      return cb(null, _.extend(doc, {
        followers: followers
      }));
    });
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

UserSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = User = mongoose.model("User", UserSchema);
