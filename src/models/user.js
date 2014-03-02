
/*
GUIDELINES for development:
- Never utilize directly request parameters or data.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
 */
var Follow, Group, HandleLimit, Inbox, Notification, ObjectId, Post, User, UserSchema, assert, async, fillInPostComments, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

async = require('async');

assert = require('assert');

Inbox = mongoose.model('Inbox');

Follow = mongoose.model('Follow');

Post = mongoose.model('Post');

Group = mongoose.model('Group');

Notification = mongoose.model('Notification');

ObjectId = mongoose.Types.ObjectId;

UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  tags: Array,
  notifiable: {
    type: Boolean,
    "default": true
  },
  lastUpdate: {
    type: Date,
    "default": Date(0)
  },
  firstAccess: Date,
  facebookId: String,
  accessToken: String,
  profile: {
    fullName: '',
    birthday: Date,
    email: String,
    city: '',
    avatarUrl: ''
  },
  badges: [],
  followingTags: []
}, {
  id: true
});

UserSchema.virtual('avatarUrl').get(function() {
  return 'https://graph.facebook.com/' + this.facebookId + '/picture';
});

UserSchema.virtual('profileUrl').get(function() {
  return '/p/' + this.username;
});

UserSchema.methods.getFollowers = function(cb) {
  return Follow.find({
    followee: this
  }, function(err, docs) {
    var followers;
    if (err) {
      return cb(err);
    }
    followers = _.filter(_.pluck(docs, 'follower'), function(i) {
      return i;
    });
    return User.find({
      _id: {
        $in: followers
      }
    }, cb);
  });
};

UserSchema.methods.getFollowing = function(cb) {
  return Follow.find({
    follower: this
  }, function(err, docs) {
    var followees;
    if (err) {
      return cb(err);
    }
    followees = _.filter(_.pluck(docs, 'followee'), function(i) {
      return i;
    });
    return User.find({
      _id: {
        $in: followees
      }
    }, cb);
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
  Follow.findOne({
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
      return cb(err, !!doc);
    };
  })(this));
  return Notification.Trigger(this, Notification.Types.NewFollower)(this, user, function() {});
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

fillInPostComments = function(docs, cb) {
  var post, results;
  assert(docs, "Can't fill invalid post(s) document.");
  if (docs instanceof Array) {
    results = [];
    return async.forEach(_.filter(docs, function(i) {
      return i;
    }), function(post, done) {
      return Post.find({
        parentPost: post
      }).populate('author').exec(function(err, comments) {
        if (post.toObject) {
          results.push(_.extend({}, post.toObject(), {
            comments: comments
          }));
        } else {
          results.push(_.extend({}, post, {
            comments: comments
          }));
        }
        return done();
      });
    }, function(err) {
      console.log('err', err);
      return cb(err, results);
    });
  } else {
    console.log('second option');
    post = docs;
    return Post.find({
      parentPost: post
    }).populate('author').exec(function(err, comments) {
      if (post.toObject) {
        return cb(err, _.extend({}, post.toObject(), {
          comments: comments
        }));
      } else {
        return cb(err, _.extend({}, post, {
          comments: comments
        }));
      }
    });
  }
};


/*
 * Behold.
 */

UserSchema.methods.getTimeline = function(_opts, cb) {
  var addNonInboxedPosts, opts;
  opts = _.extend({
    limit: 10,
    skip: 0
  }, _opts);

  /*
  	 * Merge inboxes posts with those from followed users but that preceed "followship".
  	 * Limit search to those posts made after @minDate.
   */
  addNonInboxedPosts = (function(_this) {
    return function(minDate, ips) {
      var onGetNonInboxedPosts;
      Follow.find({
        follower: _this,
        dateBegin: {
          $gt: minDate
        }
      }).exec(function(err, follows) {
        if (err) {
          return cb(err);
        }
        return async.mapLimit(follows, 5, (function(follow, done) {
          return Post.find({
            author: follow.followee,
            group: null,
            parentPost: null,
            dateCreated: {
              $lt: follow.dateBegin,
              $gt: minDate
            }
          }).limit(opts.limit).exec(done);
        }), function(err, _docs) {
          var nips;
          nips = _.flatten(_docs).filter(function(i) {
            return i;
          });
          return onGetNonInboxedPosts(err, nips);
        });
      });
      return onGetNonInboxedPosts = function(err, nips) {
        var all;
        if (err) {
          return cb(err);
        }
        all = _.sortBy(nips.concat(ips), function(p) {
          return p.dateCreated;
        });
        return User.populate(all, {
          path: 'author'
        }, (function(_this) {
          return function(err, docs) {
            if (err) {
              return cb(err);
            }
            return fillInPostComments(docs, cb);
          };
        })(this));
      };
    };
  })(this);
  return Inbox.find({
    recipient: this.id,
    type: Inbox.Types.Post
  }).sort('-dateSent').populate('resource').limit(opts.limit).skip(opts.skip).exec(HandleLimit((function(_this) {
    return function(err, docs) {
      var oldestPostDate, posts;
      if (err) {
        return cb(err);
      }
      posts = _.pluck(docs, 'resource').filter(function(i) {
        return i;
      });

      /*
      			 * Get oldest post date
      			 * Non-inboxed posts must be younger than that, so that at least opts.limit
      			 * posts are created.
       */
      if (posts.length === opts.limit) {
        oldestPostDate = posts[-1].dateCreated;
      } else {
        oldestPostDate = new Date(0);
      }
      return addNonInboxedPosts(oldestPostDate, posts);
    };
  })(this)));
};

UserSchema.statics.getPostsFromUser = function(userId, opts, cb) {
  return Post.find({
    author: userId,
    parentPost: null,
    group: null
  }).sort('-dateCreated').populate('author').limit(opts.limit || 10).skip(opts.skip || 0).exec(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return fillInPostComments(docs, cb);
  });
};

UserSchema.methods.getLabPosts = function(opts, group, cb) {
  return Post.find({
    group: group,
    parentPost: null
  }).limit(opts.limit || 10).skip(opts.skip || 0).populate('author').exec(function(err, docs) {
    return fillInPostComments(docs, cb);
  });
};

UserSchema.methods.createGroup = function(data, cb) {
  var group;
  group = new Group({
    profile: {
      name: data.profile.name
    }
  });
  return group.save((function(_this) {
    return function(err, group) {
      if (err) {
        return cb(err);
      }
      return group.addUser(_this, Group.Membership.Types.Moderator, function(err, membership) {
        return cb(err, group);
      });
    };
  })(this));
};

UserSchema.methods.addUserToGroup = function(member, group, type, cb) {
  assert(_.all([member, group, type, cb]), "Wrong number of arguments supplied to User.addUserToGroup");
  return Group.Membership.findOne({
    group: group,
    member: this
  }, function(err, mship) {
    if (err) {
      return cb(err);
    }
    if (!mship || mship.type !== Group.Membership.Types.Moderator) {
      return cb({
        error: true,
        name: 'Unauthorized'
      });
    }
    return Group.Membership.findOne({
      group: group,
      member: member
    }, function(err, mem) {
      if (err) {
        return cb(err, mem);
      }
      if (mem) {
        mem.type = type;
        return mem.save(function(err) {
          return cb(err, mem);
        });
      } else {
        mem = new Group.Membership({
          member: member,
          type: type,
          group: group
        });
        return mem.save(function(err) {
          return cb(err, mem);
        });
      }
    });
  });
};

UserSchema.methods.removeUserFromGroup = function(member, group, type, cb) {
  assert(_.all([member, group, type, cb]), "Wrong number of arguments supplied to User.addUserToGroup");
  return Group.Membership.find({
    group: group,
    member: this
  }, function(err, mship) {
    if (err) {
      return cb(err);
    }
    if (!mship) {
      return cb({
        error: true,
        name: 'Unauthorized'
      });
    }
    return Group.Membership.remove({
      group: group,
      member: member
    }, function(err, mem) {
      if (err) {
        return cb(err, mem);
      }
    });
  });
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
    postType: Post.PostTypes.Comment
  });
  comment.save(cb);
  return Notification.Trigger(this, Notification.Types.PostComment)(comment, parentPost, function() {});
};


/*
Create a post object and fan out through inboxes.
 */

UserSchema.methods.createPost = function(data, cb) {
  var post;
  post = new Post({
    author: this.id,
    data: {
      title: data.content.title,
      body: data.content.body
    }
  });
  if (data.groupId) {
    post.group = data.groupId;
  }
  return post.save((function(_this) {
    return function(err, post) {
      console.log('post save:', err, post);
      cb(err, post);
      if (post.group) {
        return;
      }
      return _this.getFollowers(function(err, followers) {
        console.log('porra', err, followers);
        return Inbox.fillInboxes({
          recipients: [_this].concat(followers),
          resource: post,
          type: Inbox.Types.Post,
          author: _this.id
        }, function() {});
      });
    };
  })(this));
};

UserSchema.methods.findAndPopulatePost = function(args, cb) {
  return Post.findOne(args).populate('author').populate('group').exec(function(err, doc) {
    if (err) {
      return cb(err);
    } else if (doc) {
      return fillInPostComments(doc, cb);
    } else {
      return cb(false, null);
    }
  });
};


/*
Generate stuffed profile for the controller.
 */

UserSchema.methods.genProfile = function(cb) {
  return this.getFollowers((function(_this) {
    return function(err1, followers) {
      if (err1) {
        followers = null;
      }
      return _this.getFollowing(function(err2, following) {
        if (err2) {
          following = null;
        }
        return Group.Membership.find({
          member: _this
        }).populate('group').exec(function(err3, memberships) {
          var profile;
          profile = _.extend(_this, {});
          if (followers) {
            profile.followers = {
              docs: followers.slice(0, 20),
              count: followers.length
            };
          }
          if (following) {
            profile.following = {
              docs: following.slice(0, 20),
              count: following.length
            };
          }
          if (memberships) {
            profile.groups = _.pluck(memberships, 'group');
          }
          return cb(err1 || err2 || err3, profile);
        });
      });
    };
  })(this));
};

UserSchema.methods.getNotifications = function(cb) {
  return Notification.find({
    recipient: this
  }).limit(10).sort('-dateSent').exec(cb);
};

UserSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = User = mongoose.model("User", UserSchema);
