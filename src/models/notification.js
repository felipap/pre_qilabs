var MsgHtmlTemplates, MsgTemplates, Notification, NotificationSchema, Types, assert, assertArgs, async, hookedModel, mongoose, notifyUser, _,
  __slice = [].slice;

mongoose = require('mongoose');

async = require('async');

_ = require('underscore');

assert = require('assert');

hookedModel = require('./lib/hookedModel');

Types = {
  PostComment: 'PostComment',
  PostAnswer: 'PostAnswer',
  NewFollower: 'NewFollower',
  UpvotedAnswer: 'UpvotedAnswer',
  SharedPost: 'SharedPost'
};

MsgTemplates = {
  PostComment: '<%= agentName %> comentou na sua publicação.',
  NewFollower: '<%= agentName %> começou a te seguir.'
};

MsgHtmlTemplates = {
  PostComment: '<strong><%= agentName %></strong> comentou na sua publicação.',
  NewFollower: '<strong><%= agentName %></strong> começou a te seguir.'
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
  dateSent: {
    type: Date,
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
  accessed: {
    type: Boolean,
    "default": false
  },
  url: {
    type: String
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

NotificationSchema.virtual('msgHtml').get(function() {
  if (MsgHtmlTemplates[this.type]) {
    return _.template(MsgHtmlTemplates[this.type], this);
  } else if (MsgTemplates[this.type]) {
    return _.template(MsgTemplates[this.type], this);
  }
  console.warn("No html template found for notification of type" + this.type);
  return "Notificação " + this.type;
});

NotificationSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

assertArgs = function() {
  var allAssertions, args, assertParam, callback, err, index, paramAssertions, _i, _j, _len;
  allAssertions = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), args = arguments[_i++];
  assertParam = function(el, assertions) {
    var ans, assertContains, assertIsModel, err, type;
    assertIsModel = function(expected, value) {
      var model;
      if (expected.schema && expected.schema instanceof mongoose.Schema) {
        model = expected;
      } else if (typeof expected === 'string') {
        model = mongoose.model(expected);
      } else {
        return "Invalid expected value for assertion of type 'ismodel': " + expected;
      }
      if (value instanceof model) {
        return false;
      }
      return "Argument '" + value + "'' doesn't match Assert {ismodel:" + expected + "}";
    };
    assertContains = function(expected, value) {
      var key, keys, _j, _len;
      if (expected instanceof Array) {
        keys = expected;
      } else if (typeof expected === 'string') {
        keys = [expected];
      } else {
        return "Invalid expected value for assertion of type 'contains': " + expected;
      }
      for (_j = 0, _len = keys.length; _j < _len; _j++) {
        key = keys[_j];
        if (!(key in value)) {
          return "Argument '" + value + "' doesn't match Assert {contains:" + expected + "}";
        }
      }
      return false;
    };
    for (type in assertions) {
      ans = assertions[type];
      switch (type) {
        case 'ismodel':
          err = assertIsModel(ans, el);
          break;
        case 'contains':
          err = assertContains(ans, el);
          break;
        default:
          return "Invalid assertion of type " + type;
      }
      if (err) {
        return err;
      }
    }
    return null;
  };
  callback = args[args.length - 1];
  for (index = _j = 0, _len = allAssertions.length; _j < _len; index = ++_j) {
    paramAssertions = allAssertions[index];
    err = assertParam(args[index], paramAssertions);
    if (err) {
      console.warn("AssertLib error on index " + index + ":", err);
      return callback({
        error: true,
        msg: err
      });
    }
  }
};

notifyUser = function(recpObj, agentObj, data, cb) {
  var User, note;
  assertArgs({
    ismodel: 'User'
  }, {
    ismodel: 'User'
  }, {
    contains: ['url', 'type']
  }, arguments);
  User = mongoose.model('User');
  note = new Notification({
    agent: agentObj,
    agentName: agentObj.name,
    recipient: recpObj,
    type: data.type,
    url: data.url0,
    thumbnailUrl: data.thumbnailUrl || agentObj.avatarUrl
  });
  if (data.resources) {
    note.resources = data.resources;
  }
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
              url: commentObj.path,
              resources: [parentPostObj.id, commentObj.id]
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
        return Notification.findOne({
          type: Types.NewFollower,
          agent: followerObj,
          recipient: followeeObj
        }, function(err, doc) {
          if (doc) {
            doc.remove(function() {});
          }
          return notifyUser(followeeObj, followerObj, {
            type: Types.NewFollower,
            url: followerObj.profileUrl
          }, cb);
        });
      };
  }
};

NotificationSchema.statics.Types = Types;

module.exports = Notification = hookedModel("Notification", NotificationSchema);
