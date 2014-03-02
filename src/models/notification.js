var MsgTemplates, Notification, NotificationSchema, Types, async, mongoose, notifyUser, _;

mongoose = require('mongoose');

async = require('async');

_ = require('underscore');

NotificationSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  agentName: {
    type: String
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: 1
  },
  type: {
    type: String,
    required: true
  },
  seen: {
    type: Boolean,
    "default": false
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: false
  },
  url: {
    type: String
  },
  dateSent: {
    type: Date,
    index: true
  },
  thumbnailUrl: {
    type: String,
    required: false
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

Types = {
  PostComment: 'PostComment',
  PostAnswer: 'PostAnswer',
  UpvotedAnswer: 'UpvotedAnswer',
  SharedPost: 'SharedPost'
};

MsgTemplates = {
  PostComment: '<%= agentName %> comentou na sua publicação',
  PostAnswer: 'PostAnswer',
  UpvotedAnswer: 'UpvotedAnswer',
  SharedPost: 'SharedPost'
};

NotificationSchema.virtual('msg').get(function() {
  if (MsgTemplates[this.type]) {
    return _.template(MsgTemplates[this.type], this);
  }
  return "Notificação";
});

NotificationSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

notifyUser = function(recpObj, agentObj, data, cb) {
  var note;
  note = new Notification({
    agent: agentObj,
    agentName: agentObj.name,
    recipient: recpObj,
    type: data.type,
    url: data.url
  });
  return note.save(function(err, doc) {
    return typeof cb === "function" ? cb(err, doc) : void 0;
  });
};

NotificationSchema.statics.Trigger = function(agentObj, type) {
  var User;
  User = mongoose.model('User');
  switch (type) {
    case Types.PostComment:
      return function(commentObj, parentPostObj, cb) {
        var parentPostAuthorId;
        if ('' + parentPostObj.author === '' + agentObj.id) {
          return cb(false);
        }
        parentPostAuthorId = parentPostObj.author;
        return User.findOne({
          _id: parentPostAuthorId
        }, function(err, parentPostAuthor) {
          if (parentPostAuthor && !err) {
            return notifyUser(parentPostAuthor, agentObj, {
              type: Types.PostComment,
              url: commentObj.path
            }, cb);
          } else {
            console.warn("err: " + err + " or parentPostAuthor (id:" + parentPostAuthorId + ") not found");
            return cb(true);
          }
        });
      };
    case Types.NewFollower:
      return function() {};
  }
};

NotificationSchema.statics.Types = Types;

module.exports = Notification = mongoose.model("Notification", NotificationSchema);
