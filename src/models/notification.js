var Notification, NotificationSchema, Types, async, mongoose, _;

mongoose = require('mongoose');

async = require('async');

_ = require('underscore');

Types = {
  PostComment: 'PostComment',
  PostAnswer: 'PostAnswer',
  UpvotedAnswer: 'UpvotedAnswer',
  SharedPost: 'SharedPost'
};

NotificationSchema = new mongoose.Schema({
  dateSent: {
    type: Date,
    index: true
  },
  agents: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  ],
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: 1
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: false
  },
  type: {
    type: String,
    required: true
  },
  msgTemplate: {
    type: String,
    required: true
  },
  url: {
    type: String
  },
  seen: {
    type: Boolean,
    "default": false
  }
}, {
  toObject: {
    virtuals: true
  },
  toJson: {
    virtuals: true
  }
});

NotificationSchema.statics.Types = Types;

NotificationSchema.virtual('msg').get = function() {
  console.log(this.msgTemplate);
  return _.template(this.msgTemplate, this);
};

NotificationSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

module.exports = Notification = mongoose.model("Notification", NotificationSchema);
