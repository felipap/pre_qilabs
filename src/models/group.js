var FollowSchema, GroupSchema, authTypes, crypto, mongoose;

mongoose = require('mongoose');

crypto = require('crypto');

authTypes = [];

GroupSchema = new mongoose.Schema({
  name: {
    type: String
  },
  tags: {
    type: Array,
    "default": []
  },
  firstAccess: Date,
  affiliation: '',
  type: '',
  badges: [],
  groups: [],
  followingTags: []
}, {
  id: true
});

FollowSchema = new mongoose.Schema({
  start: Date,
  follower: '',
  followee: ''
});

UserSchema.virtual('avatarUrl').get(function() {
  return 'https://graph.facebook.com/' + this.facebookId + '/picture';
});

UserSchema.methods = {};

UserSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = mongoose.model("User", UserSchema);
