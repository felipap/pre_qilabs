var Notification, NotificationSchema, Types, async, mongoose;

mongoose = require('mongoose');

async = require('async');

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
  agents: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
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
  switch (this.type) {
    case PostComment:
      return "<agent> comentou a sua publicação".replace(/<agent>/, this.agents[0]);
    case PostAnswer:
      return "<agent> respondeu à sua pergunta no grupo".replace(/<agent>/, this.agents[0]);
    case UpvotedAnswer:
      break;
    case SharedPost:
  }
};

NotificationSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

module.exports = Notification = mongoose.model("Notification", NotificationSchema);
