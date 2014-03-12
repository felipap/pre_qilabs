var Activity, ActivitySchema, ContentHtmlTemplates, Inbox, Notification, ObjectId, Resource, Types, assert, assertArgs, async, createAndDistributeActivity, mongoose, _;

assert = require('assert');

_ = require('underscore');

async = require('async');

mongoose = require('mongoose');

ObjectId = mongoose.Schema.ObjectId;

assertArgs = require('./lib/assertArgs');

Resource = mongoose.model('Resource');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

Types = {
  PlainActivity: "PlainActivity",
  NewFollower: "NewFollower"
};

ContentHtmlTemplates = {
  PostComment: '<strong><%= agentName %></strong> comentou na sua publicação.',
  NewFollower: '<strong><%= agentName %></strong> começou a te seguir.'
};

ActivitySchema = new mongoose.Schema({
  actor: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  icon: {
    type: String
  },
  object: {
    type: ObjectId,
    ref: 'Resource'
  },
  target: {
    type: ObjectId,
    ref: 'Resource'
  },
  verb: {
    type: String,
    "default": Types.PlainActivity,
    required: true
  },
  published: {
    type: Date,
    "default": Date.now
  },
  updated: {
    type: Date,
    "default": Date.now
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

ActivitySchema.virtual('content').get(function() {
  if (ContentHtmlTemplates[this.type]) {
    return _.template(ContentHtmlTemplates[this.type], this);
  }
  console.warn("No html template found for activity of type" + this.type);
  return "Notificação " + this.type;
});

ActivitySchema.virtual('apiPath').get(function() {
  return '/api/activities/' + this.id;
});

ActivitySchema.pre('save', function(next) {
  if (this.published == null) {
    this.published = new Date;
  }
  if (this.updated == null) {
    this.updated = new Date;
  }
  return next();
});

createAndDistributeActivity = function(agentObj, data, cb) {
  var activity;
  assertArgs({
    $isModel: 'User'
  }, {
    $contains: ['type']
  }, '$isCb');
  activity = new Activity({
    type: data.type,
    url: data.url,
    actor: data.actor,
    object: data.object,
    target: data.target
  });
  return activity.save(function(err, doc) {
    if (err) {
      console.log(err);
    }
    return agentObj.getFollowersIds(function(err, followers) {
      console.log('followers', followers);
      return Inbox.fillInboxes([agentObj].concat(followers), {
        resource: data.resource
      });
    });
  });
};

ActivitySchema.statics.Trigger = function(agentObj, type) {
  var User;
  User = mongoose.model('User');
  switch (type) {
    case Types.NewFollower:
      return function(opts, cb) {
        assertArgs({
          follow: {
            $isModel: 'Follow'
          },
          followee: {
            $isModel: 'User'
          },
          follower: {
            $isModel: 'User'
          }
        }, '$isCb', arguments);
        return Activity.remove({
          type: Types.NewFollower,
          agent: opts.follower._id,
          resources: opts.followee._id
        }, function(err, count) {
          console.log('err?', err, count);
          return createAndDistributeActivity(opts.follower, {
            type: Types.NewFollower,
            url: opts.follower.profileUrl,
            actor: opts.follower,
            object: opts.follow,
            target: opts.followee
          }, cb);
        });
      };
  }
};

ActivitySchema.statics.Types = Types;

ActivitySchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Activity = mongoose.model("Activity", ActivitySchema);
