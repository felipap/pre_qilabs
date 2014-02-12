var FollowSchema, PostSchema, crypto, mongoose;

mongoose = require('mongoose');

crypto = require('crypto');

PostSchema = new mongoose.Schema({
  firstAccess: Date,
  affiliation: '',
  type: '',
  profile: {
    fullName: '',
    birthday: Date,
    city: '',
    avatarUrl: ''
  },
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
