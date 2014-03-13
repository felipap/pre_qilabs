var Activity, ActivitySchema, ContentHtmlTemplates, Inbox, Notification, ObjectId, Resource, Types, assert, assertArgs, async, createActivityAndInbox, mongoose, _;

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
  NewFollower: "NewFollower",
  GroupCreated: "GroupCreated",
  GroupMemberAdded: "GroupMemberAdded"
};

ContentHtmlTemplates = {
  NewFollower: '<strong><a href="<%= actor.path %>"><%= actor && actor.name %></a></strong> começou a seguir <a href="<%= target.path %>"><%= target && target.name %></a>.',
  GroupCreated: '<strong><a href="<%= actor.path %>"><%= actor && actor.name %></a></strong> criou o grupo <a href="<%= object.path %>"><%= object && object.name %></a>.'
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
  group: {
    type: ObjectId,
    ref: 'Group',
    indexed: 1
  },
  verb: {
    type: String,
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
  if (this.verb in ContentHtmlTemplates) {
    return _.template(ContentHtmlTemplates[this.verb], this);
  }
  console.warn("No html template found for activity of verb " + this.verb);
  return "Notificação " + this.verb;
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

createActivityAndInbox = function(agentObj, data, cb) {
  var activity;
  assertArgs({
    $isModel: 'User'
  }, {
    $contains: ['verb', 'url', 'actor', 'object']
  }, '$isCb');
  console.log('agent:', agentObj);
  activity = new Activity({
    verb: data.verb,
    url: data.url,
    actor: data.actor,
    object: data.object,
    target: data.target
  });
  return activity.save(function(err, doc) {
    if (err) {
      console.log(err);
    }
    console.log(doc);
    return agentObj.getFollowersIds(function(err, followers) {
      return Inbox.fillInboxes([agentObj._id].concat(followers), {
        resource: activity
      }, cb);
    });
  });
};

ActivitySchema.statics.Trigger = function(agentObj, type) {
  var User;
  User = Resource.model('User');
  switch (type) {
    case Types.NewFollower:
      return function(opts, cb) {
        var genericData;
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
        genericData = {
          verb: Types.NewFollower,
          actor: opts.follower,
          target: opts.followee
        };
        return Activity.remove(genericData, function(err, count) {
          if (err) {
            console.log('trigger err:', err);
          }
          return createActivityAndInbox(opts.follower, _.extend(genericData, {
            url: opts.follower.profileUrl,
            object: opts.follow
          }), function() {});
        });
      };
    case Types.GroupCreated:
      return function(opts, cb) {
        var genericData;
        assertArgs({
          creator: {
            $isModel: 'User'
          },
          group: {
            $isModel: 'Group'
          }
        }, '$isCb', arguments);
        genericData = {
          verb: Types.GroupCreated,
          actor: opts.creator,
          object: opts.group
        };
        return Activity.remove(genericData, function(err, count) {
          if (err) {
            console.log('trigger err:', err);
          }
          return createActivityAndInbox(opts.creator, _.extend(genericData, {
            url: opts.group.path
          }), function() {});
        });
      };
    case Types.GroupMemberAdded:
      return function(opts, cb) {
        var genericData;
        assertArgs({
          actor: {
            $isModel: 'User'
          },
          member: {
            $isModel: 'User'
          },
          group: {
            $isModel: 'Group'
          }
        }, '$isCb', arguments);
        console.log('hi');
        genericData = {
          verb: Types.GroupCreated,
          object: opts.member,
          target: opts.group
        };
        return Activity.remove(genericData, function(err, count) {
          if (err) {
            console.log('trigger err:', err);
          }
          console.log('here');
          return createActivityAndInbox(opts.creator, _.extend(genericData, {
            actor: opts.actor,
            url: opts.group.path
          }), function() {});
        });
      };
    default:
      throw "Unrecognized Activity Type passed to Trigger.";
  }
};

ActivitySchema.statics.Types = Types;

ActivitySchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Activity = Resource.discriminator("Activity", ActivitySchema);
