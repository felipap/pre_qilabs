var FollowSchema, Inbox, Notification, hookedModel, mongoose;

mongoose = require('mongoose');

hookedModel = require('./lib/hookedModel');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

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
  }, function(err, result) {
    console.log("Removing " + err + " " + result + " inboxes on unfollow.");
    return next();
  });
});

FollowSchema.pre('remove', function(next) {
  return Notification.remove({
    recipient: this
  }, function(err, result) {
    console.log("Removing " + err + " " + result + " notifications on unfollow.");
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
