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
  tumblrId: {
    type: Number
  },
  tags: {
    type: Array
  },
  urlTemplate: {
    type: String,
    "default": '/{id}'
  },
  tumblrUrl: {
    type: String
  },
  tumblrPostType: {
    type: String
  },
  date: {
    type: Date
  }
}, {
  id: false
});

PostSchema.virtual('path').get(function() {
  return this.urlTemplate.replace(/{id}/, this.id);
});

getPostsWithTags = function(tags, callback) {
  return api.getPostsWithTags(blog, tags, function(err, _posts) {
    var posts;
    posts = _posts;
    return typeof callback === "function" ? callback(err, _posts) : void 0;
  });
};

PostSchema.methods = {};

PostSchema.statics.findOrCreate = findOrCreate;

blog_url = 'http://meavisa.tumblr.com';

blog = api.getBlog('meavisa.tumblr.com');

PostSchema.statics.getWithTags = function(tags, cb) {
  return api.getPostsWithTags(blog, tags, function(err, _posts) {
    var posts;
    posts = _posts;
    return typeof cb === "function" ? cb(err, _posts) : void 0;
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

PostSchema.statics.fetchAndCache = function(cb) {
  var mc,
    _this = this;
  mc = memjs.Client.create();
  console.log('Flushing cached posts.');
  return api.pushBlogTags(blog, function(err, posts) {
    if (err) {
      throw err;
    }
    return mc.set('posts', JSON.stringify(_this.recursify(posts)), cb);
  });
};

PostSchema.statics.fetchNew = function(callback) {
  var onGetTPosts;
  blog = api.getBlog('meavisa.tumblr.com');
  onGetTPosts = (function(posts) {
    var onGetDBPosts;
    return onGetDBPosts = (function(dbposts) {
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
        Post.create({
          tumblrId: post.id,
          tags: post.tags,
          tumblrUrl: post.post_url,
          tumblrPostType: post.type,
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
    }, Post.find({}, function(err, dbposts) {
      if (err) {
        if (typeof callback === "function") {
          callback(err);
        }
      }
      return onGetDBPosts(dbposts);
    }));
  });
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
