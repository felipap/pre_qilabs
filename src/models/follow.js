var FollowSchema, Inbox, hookedModel, mongoose;

mongoose = require('mongoose');

hookedModel = require('./lib/hookedModel');

Inbox = mongoose.model('Inbox');

FollowSchema = new mongoose.Schema({
  dateBegin: {
    type: Date,
    index: 1
  },
  follower: {
    type: mongoose.Schema.ObjectId,
    index: 1
  },
  followee: {
    type: mongoose.Schema.ObjectId,
    index: 1
  }
});

FollowSchema.pre('remove', function(next) {
  return Inbox.remove({
    recipient: this.follower,
    author: this.followee
  }, function() {
    console.log("Inbox removed on unfollow. Args:", arguments);
    return next();
  });
});

FollowSchema.pre('save', function(next) {
  if (this.dateBegin == null) {
    this.dateBegin = new Date;
  }
  return next();
});

module.exports = hookedModel("Follow", FollowSchema);
