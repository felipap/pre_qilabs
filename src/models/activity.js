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
  NewFollower: "NewFollower"
};

ContentHtmlTemplates = {
  NewFollower: '<strong><a href="<%= actor.path %>"><%= actor && actor.name %></a></strong> começou a seguir <a href="<%= target.path %>"><%= target && target.name %></a>.'
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

createAndDistributeActivity = function(agentObj, data, cb) {
  var activity;
  assertArgs({
    $isModel: 'User'
  }, {
    $contains: ['verb', 'url', 'actor', 'object', 'target']
  }, '$isCb');
  activity = new Activity({
    type: 'Activity',
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
          verb: Types.NewFollower,
          agent: opts.follower._id,
          target: opts.followee._id
        }, function(err, count) {
          if (err) {
            console.log('trigger err:', err);
          }
          return createAndDistributeActivity(opts.follower, {
            verb: Types.NewFollower,
            url: opts.follower.profileUrl,
            actor: opts.follower,
            object: opts.follow,
            target: opts.followee
          }, function() {});
        });
      };
  }
};

ActivitySchema.statics.Types = Types;

ActivitySchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Activity = Resource.discriminator("Activity", ActivitySchema);
