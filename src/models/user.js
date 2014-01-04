var UserSchema, authTypes, crypto, mongoose, _;

mongoose = require('mongoose');

crypto = require('crypto');

_ = require('underscore');

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
  lastUpdate: {
    type: Date,
    "default": Date(0)
  }
}, {
  id: true
});

UserSchema.virtual('avatarUrl').get(function() {
  return 'https://graph.facebook.com/' + this.facebookId + '/picture';
});

UserSchema.methods = {};

UserSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = mongoose.model("User", UserSchema);
