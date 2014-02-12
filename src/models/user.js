var FollowSchema, Inbox, UserSchema, mongoose;

mongoose = require('mongoose');

Inbox = require('./inbox.js');

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

FollowSchema = new mongoose.Schema({
  start: Date,
  follower: mongoose.Schema.ObjectId,
  followee: mongoose.Schema.ObjectId
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

UserSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = mongoose.model("User", UserSchema);
