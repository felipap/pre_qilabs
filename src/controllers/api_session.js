var Activity, Follow, Group, Inbox, Notification, Post, Resource, Subscriber, Tag, User, mongoose, required;

mongoose = require('mongoose');

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

User = mongoose.model('User');

Post = Resource.model('Post');

Tag = mongoose.model('Tag');

Inbox = mongoose.model('Inbox');

Group = mongoose.model('Group');

Follow = mongoose.model('Follow');

Activity = mongoose.model('Activity');

Subscriber = mongoose.model('Subscriber');

Notification = mongoose.model('Notification');

module.exports = {
  permissions: [required.isMe],
  methods: {
    get: function(req, res) {
      console.log(req.query);
      if (req.query.user != null) {
        return User.find({}, function(err, users) {
          return res.endJson({
            users: users
          });
        });
      } else if (req.query.inbox != null) {
        return Inbox.find({}).populate('resource').exec(function(err, inboxs) {
          return res.endJson({
            err: err,
            inboxs: inboxs
          });
        });
      } else if (req.query.group != null) {
        return Group.find({}, function(err, groups) {
          return res.endJson({
            group: groups
          });
        });
      } else if (req.query.notification != null) {
        return Notification.find({}, function(err, notifics) {
          return res.endJson({
            notifics: notifics
          });
        });
      } else if (req.query.membership != null) {
        return Group.Membership.find({}, function(err, membership) {
          return res.endJson({
            membership: membership
          });
        });
      } else if (req.query.post != null) {
        return Post.find({}, function(err, posts) {
          return res.endJson({
            posts: posts
          });
        });
      } else if (req.query.follow != null) {
        return Follow.find({}, function(err, follows) {
          return res.endJson({
            follows: follows
          });
        });
      } else if (req.query.subscriber != null) {
        return Subscriber.find({}, function(err, subscribers) {
          return res.endJson({
            subscribers: subscribers
          });
        });
      } else if (req.query.note != null) {
        return res.endJson({
          notes: notes
        });
      } else if (req.query.session != null) {
        res.endJson({
          ip: req.ip,
          session: req.session
        });
        return Activity.find({}, function(err, notes) {});
      } else {
        return User.find({}, function(err, users) {
          return Post.find({}, function(err, posts) {
            return Inbox.find({}, function(err, inboxs) {
              return Subscriber.find({}, function(err, subscribers) {
                return Follow.find({}, function(err, follows) {
                  return Notification.find({}, function(err, notifics) {
                    return Group.find({}, function(err, groups) {
                      return Group.Membership.find({}, function(err, memberships) {
                        return Activity.find({}, function(err, notes) {
                          var obj;
                          obj = {
                            ip: req.ip,
                            group: groups,
                            inboxs: inboxs,
                            notifics: notifics,
                            membership: memberships,
                            session: req.session,
                            users: users,
                            posts: posts,
                            follows: follows,
                            notes: notes,
                            subscribers: subscribers
                          };
                          return res.endJson(obj);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      }
    }
  }
};
