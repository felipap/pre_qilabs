
/*
GUIDELINES for development:
- Never utilize directly request parameters or data.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
 */
var Follow, Group, Inbox, ObjectId, Post, User, UserSchema, async, fillComments, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

async = require('async');

Inbox = mongoose.model('Inbox');

Follow = mongoose.model('Follow');

Post = mongoose.model('Post');

Group = mongoose.model('Group');

ObjectId = mongoose.Types.ObjectId;

UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  tags: Array,
  facebookId: String,
  accessToken: String,
  notifiable: {
    type: Boolean,
    "default": true
  },
  lastUpdate: {
    type: Date,
    "default": Date(0)
  },
  firstAccess: Date,
  contact: {
    email: String
  },
  profile: {
    fullName: '',
    birthday: Date,
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
    followee: this.id
  }, function(err, docs) {
    return User.find({
      _id: {
        $in: _.pluck(docs, 'follower')
      }
    }, function(err, docs) {
      return cb(err, docs);
    });
  });
};

UserSchema.methods.getFollowing = function(cb) {
  return Follow.find({
    follower: this.id
  }, function(err, docs) {
    return User.find({
      _id: {
        $in: _.pluck(docs, 'followee')
      }
    }, function(err, docs) {
      return cb(err, docs);
    });
  });
};

UserSchema.methods.countFollowers = function(cb) {
  return Follow.count({
    followee: this.id
  }, function(err, count) {
    return cb(err, count);
  });
};

UserSchema.methods.doesFollowUser = function(user2, cb) {
  console.assert(user2.id, 'Passed argument not a user document');
  return Follow.findOne({
    followee: user2.id,
    follower: this.id
  }, function(err, doc) {
    return cb(err, !!doc);
  });
};

UserSchema.methods.followId = function(userId, cb) {
  console.assert(userId);
  return Follow.findOne({
    follower: this,
    followee: userId
  }, (function(_this) {
    return function(err, doc) {
      if (!doc) {
        doc = new Follow({
          follower: _this,
          followee: userId
        });
        doc.save();
        console.log("<" + _this.username + "> followed: " + doc.followee);
      }
      return cb(err, !!doc);
    };
  })(this));
};

UserSchema.methods.unfollowId = function(userId, cb) {
  return Follow.findOne({
    follower: this,
    followee: userId
  }, function(err, doc) {
    console.log("<" + this.username + "> unfollowing: " + doc.followee);
    return doc.remove(function(err, num) {
      return cb(err, !!num);
    });
  });
};

fillComments = function(docs, cb) {
  var results;
  results = [];
  return async.forEach(_.filter(docs, function(i) {
    return i;
  }), function(post, asyncCb) {
    return Post.find({
      parentPost: post
    }).populate('author').exec(function(err, comments) {
      results.push(_.extend({}, post.toObject(), {
        comments: comments
      }));
      return asyncCb();
    });
  }, function(err) {
    return cb(err, results);
  });
};

UserSchema.methods.getTimeline = function(opts, cb) {
  return Inbox.find({
    recipient: this.id
  }).sort('-dateSent').populate('post').select('post').limit(opts.limit || 10).skip(opts.skip || 0).exec(function(err, inboxes) {
    if (err) {
      return cb(err);
    }
    return User.populate(inboxes, {
      path: 'post.author'
    }, function(err, docs) {
      if (err) {
        return cb(err);
      }
      return fillComments(_.pluck(docs, 'post'), cb);
    });
  });
};

UserSchema.statics.getPostsFromUser = function(userId, opts, cb) {
  return Post.find({
    author: userId,
    parentPost: null,
    group: null
  }).sort('-dateCreated').populate('author').limit(opts.limit || 10).skip(opts.skip || null).exec(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return fillComments(docs, cb);
  });
};

UserSchema.methods.getLabPosts = function(opts, group, cb) {
  return Post.find({
    group: group
  }).limit(opts.limit || 10).skip(opts.skip || 0).populate('author').exec(function(err, docs) {
    return fillComments(docs, cb);
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
  console.assert(_.all([member, group, type, cb]), "Wrong number of arguments supplied to User.addUserToGroup");
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
        console.log('meme', mem);
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
  console.assert(_.all([member, group, type, cb]), "Wrong number of arguments supplied to User.addUserToGroup");
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
  var post;
  post = new Post({
    author: this,
    group: parentPost.group,
    data: {
      body: data.content.body
    },
    parentPost: parentPost,
    postType: Post.PostTypes.Comment
  });
  return post.save(cb);
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
      console.log('yes, here', err, post);
      cb(err, post);
      if (post.group) {
        return;
      }
      return _this.getFollowers(function(err, docs) {
        var follower, _i, _len, _results;
        Inbox.create({
          author: _this.id,
          recipient: _this.id,
          post: post
        }, function() {});
        _results = [];
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          follower = docs[_i];
          _results.push(Inbox.create({
            author: _this.id,
            recipient: follower.id,
            post: post
          }, function() {}));
        }
        return _results;
      });
    };
  })(this));
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
            console.log('followers');
            profile.followers = {
              docs: followers.slice(0, 20),
              count: followers.length
            };
          }
          if (following) {
            console.log('following');
            profile.following = {
              docs: following.slice(0, 20),
              count: following.length
            };
          }
          if (memberships) {
            console.log('memberships');
            profile.groups = _.pluck(memberships, 'group');
          }
          return cb(err1 || err2 || err3, profile);
        });
      });
    };
  })(this));
};

UserSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = User = mongoose.model("User", UserSchema);
