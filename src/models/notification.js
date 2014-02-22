var Notification, NotificationSchema, Types, async, mongoose;

mongoose = require('mongoose');

async = require('async');

Types = {
  Post: 'Post'
};

NotificationSchema = new mongoose.Schema({
  dateSent: {
    type: Date,
    index: true
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    index: 1,
    required: true
  },
  msg: {
    type: String
  },
  url: {
    type: String
  },
  seen: {
    type: Boolean,
    "default": false
  }
});

NotificationSchema.statics.Types = Types;

NotificationSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

module.exports = Notification = mongoose.model("Notification", NotificationSchema);
