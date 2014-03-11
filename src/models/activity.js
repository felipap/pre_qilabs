var Activity, ActivitySchema, Notification, ObjectId, Types, assert, assertArgs, async, createAndDistributeActivity, hookedModel, mongoose, _;

mongoose = require('mongoose');

assert = require('assert');

_ = require('underscore');

async = require('async');

assertArgs = require('./lib/assertArgs');

hookedModel = require('./lib/hookedModel');

Notification = mongoose.model('Notification');

ObjectId = mongoose.Schema.ObjectId;

Types = {
  PlainActivity: "PlainActivity",
  NewFollower: "NewFollower"
};

ActivitySchema = new mongoose.Schema({
  recipient: {
    type: ObjectId,
    indexed: 1,
    required: false
  },
  group: {
    type: ObjectId,
    ref: 'Group',
    indexed: 1,
    required: false
  },
  type: {
    type: String,
    "default": Types.PlainActivity,
    required: true
  },
  dateCreated: {
    type: Date
  },
  actpr: {
    type: ObjectId,
    ref: 'User'
  },
  resources: [
    {
      label: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      object: {
        type: ObjectId,
        required: true
      }
    }
  ]
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

ActivitySchema.pre('save', function(next) {
  if (this.dateCreated == null) {
    this.dateCreated = new Date;
  }
  return next();
});

createAndDistributeActivity = function(agentObj, data, cb) {
  assertArgs({
    $ismodel: 'User'
  }, {
    $contains: ['type']
  }, {
    $iscb: true
  }, arguments);
  return agentObj.getFollowersIds(function(err, followers) {
    console.log('followers', followers);
    return async.mapLimit(followers, 5, (function(rec, done) {
      var note;
      note = new Activity({
        agent: agentObj,
        recipient: rec,
        type: data.type
      });
      if (data.resources) {
        note.resources = data.resources;
      }
      if (data.url) {
        note.url = data.url;
      }
      return note.save(done);
    }), function() {
      return console.log(arguments);
    });
  });
};

ActivitySchema.statics.populateResources = function(docs, cb) {
  var Post, User;
  Post = mongoose.model('Post');
  User = mongoose.model('User');
  return Activity.find({
    'resources.type': 'User'
  }).populate({
    path: 'resources.object',
    model: 'User'
  }).exec(function() {
    return console.log(arguments);
  });
};

ActivitySchema.statics.Trigger = function(agentObj, type) {
  var User;
  User = mongoose.model('User');
  switch (type) {
    case Types.NewFollower:
      return function(followerObj, followeeObj, cb) {
        if (cb == null) {
          cb = function() {};
        }
        return Activity.remove({
          type: Types.NewFollower,
          agent: followerObj._id,
          resources: followeeObj._id
        }, function(err, count) {
          console.log('err?', err, count);
          return createAndDistributeActivity(followerObj, {
            type: Types.NewFollower,
            url: followerObj.profileUrl,
            resources: [
              {
                label: 'followee',
                type: 'User',
                object: followeeObj
              }
            ]
          }, cb);
        });
      };
  }
};

ActivitySchema.statics.Types = Types;

module.exports = Activity = hookedModel("Activity", ActivitySchema);
