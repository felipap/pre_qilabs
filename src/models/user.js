
/*
GUIDELINES for development:
- Never utilize directly request parameters or data.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
 */
var Activity, Follow, Group, HandleLimit, Inbox, Notification, ObjectId, Post, Resource, User, UserSchema, assert, assertArgs, async, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

async = require('async');

assert = require('assert');

assertArgs = require('./lib/assertArgs');

Resource = mongoose.model('Resource');

Activity = Resource.model('Activity');

Notification = mongoose.model('Notification');

Inbox = mongoose.model('Inbox');

Follow = Resource.model('Follow');

Group = Resource.model('Group');

Post = Resource.model('Post');

ObjectId = mongoose.Types.ObjectId;

UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  lastAccess: Date,
  firstAccess: Date,
  facebookId: String,
  accessToken: String,
  profile: {
    fullName: '',
    birthday: Date,
    email: String,
    city: '',
    avatarUrl: '',
    badges: []
  },
  tags: [
    {
      type: String
    }
  ],
  memberships: [
    {
      group: {
        type: String,
        required: true,
        ref: 'Group'
      },
      since: {
        type: Date,
        "default": Date.now
      },
      permission: {
        type: String,
        "enum": _.values(Group.MembershipTypes),
        required: true,
        "default": 'Moderator'
      }
    }
  ],
  followingTags: [],
  lastUpdate: {
    type: Date,
    "default": Date(0)
  },
  notifiable: {
    type: Boolean,
    "default": true
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

UserSchema.virtual('avatarUrl').get(function() {
  return 'https://graph.facebook.com/' + this.facebookId + '/picture';
});

UserSchema.virtual('profileUrl').get(function() {
  return '/p/' + this.username;
});

UserSchema.virtual('path').get(function() {
  return '/p/' + this.username;
});

UserSchema.pre('remove', function(next) {
  return Follow.find().or([
    {
      followee: this
    }, {
      follower: this
    }
  ]).exec((function(_this) {
    return function(err, docs) {
      var follow, _i, _len;
      if (docs) {
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          follow = docs[_i];
          follow.remove(function() {});
        }
      }
      console.log("Removing " + err + " " + docs.length + " follows of " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.pre('remove', function(next) {
  return Post.find({
    author: this
  }, (function(_this) {
    return function(err, docs) {
      var doc, _i, _len;
      if (docs) {
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          doc = docs[_i];
          doc.remove(function() {});
        }
      }
      console.log("Removing " + err + " " + docs.length + " posts of " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.pre('remove', function(next) {
  return Notification.find().or([
    {
      agent: this
    }, {
      recipient: this
    }
  ]).remove((function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs + " notifications related to " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.pre('remove', function(next) {
  return Activity.remove({
    actor: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs + " activities related to " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.methods.getFollowsAsFollowee = function(cb) {
  return Follow.find({
    followee: this,
    follower: {
      $ne: null
    }
  }, cb);
};

UserSchema.methods.getFollowsAsFollower = function(cb) {
  return Follow.find({
    follower: this,
    followee: {
      $ne: null
    }
  }, cb);
};

UserSchema.methods.getPopulatedFollowers = function(cb) {
  return this.getFollowsAsFollowee(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return User.populate(docs, {
      path: 'follower'
    }, function(err, popFollows) {
      return cb(err, _.filter(_.pluck(popFollows, 'follower'), function(i) {
        return i;
      }));
    });
  });
};

UserSchema.methods.getPopulatedFollowing = function(cb) {
  return this.getFollowsAsFollower(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return User.populate(docs, {
      path: 'followee'
    }, function(err, popFollows) {
      return cb(err, _.filter(_.pluck(popFollows, 'followee'), function(i) {
        return i;
      }));
    });
  });
};

UserSchema.methods.getFollowersIds = function(cb) {
  return this.getFollowsAsFollowee(function(err, docs) {
    console.log(docs, _.pluck(docs || [], 'follower'));
    return cb(err, _.pluck(docs || [], 'follower'));
  });
};

UserSchema.methods.getFollowingIds = function(cb) {
  return this.getFollowsAsFollower(function(err, docs) {
    return cb(err, _.pluck(docs || [], 'followee'));
  });
};

UserSchema.methods.countFollowers = function(cb) {
  return Follow.count({
    followee: this
  }, cb);
};

UserSchema.methods.countFollowees = function(cb) {
  return Follow.count({
    follower: this
  }, cb);
};

UserSchema.methods.doesFollowUser = function(user, cb) {
  assert(user instanceof User, 'Passed argument not a user document');
  return Follow.findOne({
    followee: user.id,
    follower: this.id
  }, function(err, doc) {
    return cb(err, !!doc);
  });
};

UserSchema.methods.dofollowUser = function(user, cb) {
  assert(user instanceof User, 'Passed argument not a user document');
  if ('' + user.id === '' + this.id) {
    return cb(true);
  }
  return Follow.findOne({
    follower: this,
    followee: user
  }, (function(_this) {
    return function(err, doc) {
      if (!doc) {
        doc = new Follow({
          follower: _this,
          followee: user
        });
        doc.save();
      }
      cb(err, !!doc);
      Notification.Trigger(_this, Notification.Types.NewFollower)(_this, user, function() {});
      return Activity.Trigger(_this, Notification.Types.NewFollower)({
        follow: doc,
        follower: _this,
        followee: user
      }, function() {});
    };
  })(this));
};

UserSchema.methods.unfollowUser = function(user, cb) {
  assert(user instanceof User, 'Passed argument not a user document');
  return Follow.findOne({
    follower: this,
    followee: user
  }, (function(_this) {
    return function(err, doc) {
      if (err) {
        return cb(err);
      }
      if (doc) {
        return doc.remove(cb);
      }
    };
  })(this));
};

HandleLimit = function(func) {
  return function(err, _docs) {
    var docs;
    docs = _.filter(_docs, function(e) {
      return e;
    });
    return func(err, docs);
  };
};

UserSchema.statics.reInbox = function(user, callback) {
  return user.getFollowingIds(function(err, followingIds) {
    if (followingIds == null) {
      followingIds = [];
    }
    return async.mapLimit(followingIds.concat(user.id), 3, (function(fId, next) {
      return Activity.find({
        actor: fId
      }, function(err, activities) {
        if (activities == null) {
          activities = [];
        }
        if (err) {
          console.log(1, err);
        }
        return Post.find({
          author: fId
        }, function(err, posts) {
          if (posts == null) {
            posts = [];
          }
          if (err) {
            console.log(2, err);
          }
          return next(null, posts.concat(activities));
        });
      });
    }), function(err, posts) {});
  });
};


/*
 * Behold.
 */

UserSchema.methods.getTimeline = function(opts, callback) {
  var mergeNonInboxedPosts, self;
  assertArgs({
    $contains: ['limit', 'maxDate']
  }, '$isCb');
  self = this;
  User.reInbox(this, function() {});

  /*
  	 * Get inboxed posts older than the opts.maxDate determined by the user.
   */
  Inbox.find({
    recipient: self.id,
    dateSent: {
      $lt: opts.maxDate
    }
  }).sort('-dateSent').populate('resource').limit(opts.limit).exec((function(_this) {
    return function(err, docs) {
      var oldestPostDate, posts;
      if (err) {
        return cb(err);
      }
      posts = _.pluck(docs, 'resource').filter(function(i) {
        return i;
      });
      console.log("" + posts.length + " posts gathered from inbox");
      if (!posts.length || !docs[docs.length - 1]) {
        oldestPostDate = 0;
      } else {
        oldestPostDate = posts[posts.length - 1].published;
      }
      return mergeNonInboxedPosts(oldestPostDate, posts);
    };
  })(this));

  /*
  	 * Merge inboxes posts with those from followed users but that preceed "followship".
  	 * Limit search to those posts made after @minDate.
   */
  return mergeNonInboxedPosts = (function(_this) {
    return function(minDate, ips) {
      var onGetNonInboxedPosts;
      Follow.find({
        follower: self,
        dateBegin: {
          $gt: minDate
        }
      }, function(err, follows) {
        if (err) {
          return callback(err);
        }
        return async.mapLimit(follows, 5, (function(follow, done) {
          var ltDate;
          ltDate = Math.min(follow.dateBegin, opts.maxDate);
          return Post.find({
            author: follow.followee,
            group: null,
            parentPost: null,
            published: {
              $lt: ltDate,
              $gt: minDate
            }
          }).limit(opts.limit).exec(done);
        }), function(err, _docs) {
          var nips;
          nips = _.flatten(_docs).filter(function(i) {
            return i;
          });
          console.log("" + nips.length + " posts gathered from follow");
          return onGetNonInboxedPosts(err, nips);
        });
      });
      return onGetNonInboxedPosts = function(err, nips) {
        var all;
        if (err) {
          return callback(err);
        }
        all = _.sortBy(nips.concat(ips), function(p) {
          return -p.published;
        });
        return Resource.populate(all, {
          path: 'author actor target object'
        }, (function(_this) {
          return function(err, docs) {
            if (err) {
              return callback(err);
            }
            console.log('dates:\n' + _.map(docs, function(i) {
              return i.published;
            }).join('\n'));
            minDate = docs.length ? docs[docs.length - 1].published : 0;
            console.log('minDate', minDate);
            return Post.fillComments(docs, function(err, docs) {
              return callback(err, docs, minDate);
            });
          };
        })(this));
      };
    };
  })(this);
};

UserSchema.statics.getPostsFromUser = function(userId, opts, cb) {
  if (!opts.maxDate) {
    opts.maxDate = Date.now();
  }
  return Post.find({
    author: userId,
    parentPost: null,
    group: null,
    published: {
      $lt: opts.maxDate - 1
    }
  }).sort('-published').populate('author').limit(opts.limit || 4).exec(HandleLimit(function(err, docs) {
    var minPostDate;
    if (err) {
      return cb(err);
    }
    minPostDate = 1 * (docs.length && docs[docs.length - 1].published) || 0;
    return async.parallel([
      function(next) {
        return Activity.find({
          actor: userId,
          group: null,
          updated: {
            $lt: opts.maxDate,
            $gt: minPostDate
          }
        }).populate('resource actor target object').exec(next);
      }, function(next) {
        return Post.fillComments(docs, next);
      }
    ], HandleLimit(function(err, results) {
      var activities, all, posts;
      activities = results[0];
      posts = results[1];
      all = _.sortBy(posts.concat(activities), function(p) {
        return -p.published;
      });
      return cb(err, all, minPostDate);
    }));
  }));
};

UserSchema.methods.getLabPosts = function(opts, group, cb) {
  if (!opts.maxDate) {
    opts.maxDate = Date.now();
  }
  return Post.find({
    group: group,
    parentPost: null,
    published: {
      $lt: opts.maxDate
    }
  }).sort('-published').limit(opts.limit || 10).populate('author').exec(HandleLimit(function(err, docs) {
    var minPostDate;
    if (err) {
      return cb(err);
    }
    console.log('docs', docs);
    minPostDate = (docs.length && docs[docs.length - 1].published) || 0;
    return async.parallel([
      function(next) {
        var minDate;
        minDate = minPostDate;
        return Activity.find({
          group: group,
          updated: {
            $lt: opts.maxDate,
            $gt: minDate
          }
        }).populate('resource actor target object').exec(next);
      }, function(next) {
        return Post.fillComments(docs, next);
      }
    ], function(err, results) {
      var activities, all, posts;
      activities = results[0];
      posts = results[1];
      all = _.sortBy(results[1].concat(results[0]), function(p) {
        return p.published;
      });
      return cb(err, all, minPostDate);
    });
  }));
};

UserSchema.methods.createGroup = function(data, cb) {
  var group, self;
  self = this;
  group = new Group({
    name: data.profile.name,
    profile: {
      name: data.profile.name
    }
  });
  return group.save((function(_this) {
    return function(err, group) {
      console.log(err, group);
      if (err) {
        return cb(err);
      }
      return self.update({
        $push: {
          memberships: {
            member: user,
            permission: Group.MembershipTypes.Moderator,
            group: group.id
          }
        }
      }, function() {
        cb(null, group);
        return Activity.Trigger(this, Activity.Types.GroupCreated)({
          group: group,
          creator: self
        }, function() {});
      });
    };
  })(this));
};

UserSchema.methods.addUserToGroup = function(user, group, cb) {
  var mem, self;
  self = this;
  assertArgs({
    $isModel: 'User'
  }, {
    $isModel: 'Group'
  }, '$isCb');
  if (mem = _.findWhere(user.memberships, {
    group: group.id
  })) {
    return cb();
  } else {
    return user.update({
      $push: {
        memberships: {
          member: user,
          permission: Group.MembershipTypes.Member,
          group: group.id
        }
      }
    }, (function(_this) {
      return function(err) {
        cb(err, mem);
        return Activity.Trigger(_this, Activity.Types.GroupMemberAdded)({
          group: group,
          actor: _this,
          member: user
        }, function() {});
      };
    })(this));
  }
};

UserSchema.methods.removeUserFromGroup = function(member, group, type, cb) {
  var mem, self;
  self = this;
  mem = _.findWhere(user.memberships, {
    group: group.id
  });
  if (mem) {
    return cb();
  } else {
    return user.update({
      $push: {
        memberships: {
          member: user,
          permission: Group.MembershipTypes.Member,
          group: group.id
        }
      }
    }, (function(_this) {
      return function(err) {
        cb(err, mem);
        return Activity.Trigger(_this, Activity.Types.GroupMemberAdded)({
          group: group,
          actor: _this,
          member: user
        }, function() {});
      };
    })(this));
  }
};


/*
Create a post object with type comment.
 */

UserSchema.methods.commentToPost = function(parentPost, data, cb) {
  var comment;
  comment = new Post({
    author: this,
    group: parentPost.group,
    data: {
      body: data.content.body
    },
    parentPost: parentPost,
    type: Post.Types.Comment
  });
  comment.save(cb);
  return Notification.Trigger(this, Notification.Types.PostComment)(comment, parentPost, function() {});
};


/*
Create a post object and fan out through inboxes.
 */

UserSchema.methods.createPost = function(data, cb) {
  var post, _ref;
  post = new Post({
    author: this.id,
    data: {
      title: data.content.title,
      body: data.content.body
    },
    type: ((_ref = Post.Types) != null ? _ref.PlainPost : void 0) || 'PlainPost'
  });
  if (data.groupId) {
    post.group = data.groupId;
  }
  return post.save((function(_this) {
    return function(err, post) {
      console.log('post save:', err, post);
      cb(err, post);
      if (err) {
        return;
      }
      if (post.group) {
        return;
      }
      return _this.getPopulatedFollowers(function(err, followers) {
        return Inbox.fillInboxes([_this].concat(followers), {
          resource: post.id,
          type: Inbox.Types.Post,
          author: _this.id
        }, function() {});
      });
    };
  })(this));
};


/*
Generate stuffed profile for the controller.
 */

UserSchema.methods.genProfile = function(cb) {
  var self;
  self = this;
  return this.getPopulatedFollowers((function(_this) {
    return function(err, followers) {
      if (err) {
        return cb(err);
      }
      return _this.getPopulatedFollowing(function(err, following) {
        if (err) {
          return cb(err);
        }
        return self.populate('memberships.group', function(err, _groups) {
          var groups, profile;
          if (err) {
            return cb(err);
          }
          groups = _.filter(_groups, function(i) {
            return i && i.group;
          });
          profile = _.extend(self.toJSON(), {
            followers: {
              docs: followers.slice(0, 20),
              count: followers.length
            },
            following: {
              docs: following.slice(0, 20),
              count: following.length
            },
            groups: {
              docs: _.pluck(groups, 'group').slice(0, 20),
              count: _.pluck(groups, 'group').length
            }
          });
          return cb(null, profile);
        });
      });
    };
  })(this));
};

UserSchema.methods.getNotifications = function(cb) {
  return Notification.find({
    recipient: this
  }).limit(6).sort('-dateSent').exec(cb);
};

UserSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = User = Resource.discriminator("User", UserSchema);
