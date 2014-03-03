var AssertArgs, MsgTemplates, Notification, NotificationSchema, Types, assert, async, hookedModel, mongoose, notifyUser, _;

mongoose = require('mongoose');

async = require('async');

_ = require('underscore');

assert = require('assert');

hookedModel = require('./lib/hookedModel');

Types = {
  PostComment: 'PostComment',
  PostAnswer: 'PostAnswer',
  PostAnswer: 'PostAnswer',
  NewFollower: 'NewFollower',
  UpvotedAnswer: 'UpvotedAnswer',
  SharedPost: 'SharedPost'
};

MsgTemplates = {
  PostComment: '<%= agentName %> comentou na sua publicação',
  NewFollower: '<%= agentName %> começou a te seguir'
};

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
  url: {
    type: String
  },
  dateSent: {
    type: Date,
    index: true
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: false
  },
  resources: [
    {
      type: mongoose.Schema.ObjectId
    }
  ],
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

NotificationSchema.virtual('msg').get(function() {
  if (MsgTemplates[this.type]) {
    return _.template(MsgTemplates[this.type], this);
  }
  console.warn("No template found for notification of type" + this.type);
  return "Notificação " + this.type;
});

NotificationSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

AssertArgs = function(args) {
  return function(func) {
    return func;
  };
};

notifyUser = AssertArgs({
  ismodel: 'User'
}, {
  ismodel: 'User'
}, {
  has: ['url', 'type']
})(function(recpObj, agentObj, data, cb) {
  var User, note;
  User = mongoose.model('User');
  assert(recpObj instanceof User && agentObj instanceof User, "Invalid arguments. recpObj and agentObj must be instances of the User Schema.");
  assert(data.type, "Invalid arguments. data.type and data.url must be provided.");
  assert(data.type && data.url, "Invalid arguments. data.type and data.url must be provided.");
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
});

NotificationSchema.statics.Trigger = function(agentObj, type) {
  var User;
  User = mongoose.model('User');
  switch (type) {
    case Types.PostComment:
      return function(commentObj, parentPostObj, cb) {
        var parentPostAuthorId;
        if (cb == null) {
          cb = function() {};
        }
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
      return function(followerObj, followeeObj, cb) {
        if (cb == null) {
          cb = function() {};
        }
        return notifyUser(followeeObj, followerObj, {
          type: Types.NewFollower,
          url: followerObj.profileUrl
        }, cb);
      };
  }
};

NotificationSchema.statics.Types = Types;

module.exports = Notification = hookedModel("Notification", NotificationSchema);
