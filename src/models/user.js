var UserSchema, authTypes, crypto, mongoose;

mongoose = require('mongoose');

crypto = require('crypto');

authTypes = [];

UserSchema = new mongoose.Schema({
  name: {
    type: String
  },
  tags: {
    type: Array,
    "default": []
  },
  facebookId: {
    type: String
  },
  accessToken: {
    type: String
  },
  notifiable: {
    type: Boolean,
    "default": true
  },
  lastUpdate: {
    type: Date,
    "default": Date(0)
  },
  firstAccess: Date,
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

UserSchema.virtual('avatarUrl').get(function() {
  return 'https://graph.facebook.com/' + this.facebookId + '/picture';
});

UserSchema.methods = {};

UserSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = mongoose.model("User", UserSchema);
