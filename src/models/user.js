var Follow, Inbox, UserSchema, mongoose;

mongoose = require('mongoose');

Inbox = require('./inbox.js');

Follow = require('./follow.js');

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

UserSchema.virtual('url').get(function() {
  return '/p/' + this.username;
});

UserSchema.methods.getInbox = function(opts, cb) {
  return Inbox.getUserInbox(this, opts, cb);
};

UserSchema.methods.getBoard = function(opts, cb) {
  return Inbox.getUserBoard(this, opts, cb);
};

UserSchema.methods.followsId = function(userId, cb) {
  if (!userId) {
    cb(true);
  }
  return Follow.findOne({
    followee: this.id,
    follower: userId
  }, function(err, doc) {
    return cb(err, !!doc);
  });
};

UserSchema.methods.dofollowId = function(userId, cb) {
  if (!userId) {
    cb(true);
  }
  return Follow.findOneAndUpdate({
    followee: this.id,
    follower: userId
  }, {}, {
    upsert: true
  }, function(err, doc) {
    return console.log("Now following:", err, doc);
  });
};

UserSchema.methods.unfollowId = function(userId, cb) {
  return Follow.findOneAndRemove({
    followee: this.id,
    follower: userId
  }, {
    upsert: true
  }, function(err, doc) {
    return console.log("Now unfollowing:", err, doc);
  });
};

UserSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = mongoose.model("User", UserSchema);
