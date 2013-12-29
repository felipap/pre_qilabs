/*
# models/post.coffee
# for meavisa.org, by @f03lipe
#
# Post model.
*/

var PostSchema, api, authTypes, blog, blog_url, crypto, findOrCreate, getPostsWithTags, memjs, mongoose, _;

mongoose = require('mongoose');

crypto = require('crypto');

memjs = require('memjs');

_ = require('underscore');

authTypes = [];

api = require('./../api');

findOrCreate = require('./lib/findOrCreate');

PostSchema = new mongoose.Schema({
  tumblrId: Number,
  tags: Array,
  urlTemplate: {
    type: String,
    "default": '/#posts/{id}'
  },
  tumblrUrl: String,
  tumblrPostType: String,
  date: Date,
  body: String,
  title: String,
  isHosted: Boolean
}, {
  id: false,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

PostSchema.virtual('path').get(function() {
  return this.urlTemplate.replace(/{id}/, this.tumblrId);
});

getPostsWithTags = function(tags, callback) {
  return blog.posts({
    limit: -1
  }, function(err, data) {
    var posts;
    if (err) {
      return typeof callback === "function" ? callback(err) : void 0;
    }
    posts = [];
    data.posts.forEach(function(post) {
      var int;
      int = _.intersection(post.tags, tags);
      if (int[0]) {
        return posts.push(post);
      }
    });
    return typeof callback === "function" ? callback(err, posts) : void 0;
  });
};

PostSchema.methods = {};

PostSchema.statics.findOrCreate = findOrCreate;

blog_url = 'http://meavisa.tumblr.com';

blog = api.getBlog('meavisa.tumblr.com');

PostSchema.statics.get = function(cb) {
  var _this = this;
  return this.getCached(function(err, docs) {
    if (err || !docs.length) {
      return _this.find({}, function(err, docs) {
        return cb(err, docs);
      });
    } else {
      return cb(null, docs);
    }
  });
};

PostSchema.statics.getWithTags = function(tags, cb) {
  return this.get(function(err, docs) {
    if (err) {
      cb(err);
    }
    return cb(null, _.filter(docs, function(doc) {
      return _.intersection(doc.tags, tags).length;
    }));
  });
};

PostSchema.statics.getCached = function(cb) {
  var mc;
  mc = memjs.Client.create();
  return mc.get('posts', function(err, val, key) {
    var ret;
    if (err) {
      console.warn('Cache error:', err);
      ret = [];
    } else if (val === null) {
      console.warn('Cache query for posts returned null.');
      ret = [];
    } else {
      ret = JSON.parse(val.toString());
    }
    return cb(null, ret);
  });
};

PostSchema.statics.flushCache = function(cb) {
  var mc,
    _this = this;
  mc = memjs.Client.create();
  console.log('Flushing cached posts.');
  return this.find({}, function(err, docs) {
    if (err) {
      throw err;
    }
    return mc.set('posts', JSON.stringify(docs), cb);
  });
};

PostSchema.statics.fetchAndCache = function(cb) {
  var _this = this;
  return this.fetchNew(function(err, docs) {
    return _this.flushCache(function(err2, num) {
      return typeof cb === "function" ? cb(err2 || err, num) : void 0;
    });
  });
};

PostSchema.statics.fetchNew = function(callback) {
  var onGetTPosts,
    _this = this;
  blog = api.getBlog('meavisa.tumblr.com');
  onGetTPosts = function(posts) {
    var onGetDBPosts;
    onGetDBPosts = function(dbposts) {
      var newposts, post, postsNotSaved, _i, _len;
      postsNotSaved = 0;
      newposts = [];
      for (_i = 0, _len = posts.length; _i < _len; _i++) {
        post = posts[_i];
        if (!(!_.findWhere(dbposts, {
          tumblrId: post.id
        }))) {
          continue;
        }
        ++postsNotSaved;
        newposts.push(post);
        console.log("pushing new post \"" + post.title + "\"");
        _this.create({
          tumblrId: post.id,
          tags: post.tags,
          tumblrUrl: post.post_url,
          tumblrPostType: post.type,
          body: post.body,
          title: post.title,
          date: post.date
        }, (function(err, data) {
          if (err) {
            if (typeof callback === "function") {
              callback(err);
            }
          }
          if (--postsNotSaved === 0) {
            return typeof callback === "function" ? callback(null, newposts) : void 0;
          }
        }));
      }
      if (newposts.length === 0) {
        console.log('No new posts to push. Quitting.');
        return callback(null, []);
      }
    };
    return _this.find({}, function(err, dbposts) {
      if (err) {
        if (typeof callback === "function") {
          callback(err);
        }
      }
      return onGetDBPosts(dbposts);
    });
  };
  return blog.posts({
    limit: -1
  }, function(err, data) {
    if (err) {
      if (typeof callback === "function") {
        callback(err);
      }
    }
    return onGetTPosts(data.posts);
  });
};

module.exports = mongoose.model("Post", PostSchema);
