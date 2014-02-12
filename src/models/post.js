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
  tumblrUrl: String,
  tumblrPostType: String,
  date: Date,
  body: String,
  isHosted: Boolean,
  data: {
    title: String
  }
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
  return "/#posts/{id}".replace(/{id}/, this.tumblrId);
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
  return this.getCached((function(_this) {
    return function(err, docs) {
      if (err || !docs.length) {
        return _this.find({}, function(err, docs) {
          return cb(err, docs);
        });
      } else {
        return cb(null, docs);
      }
    };
  })(this));
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
  var mc;
  mc = memjs.Client.create();
  console.log('Flushing cached posts.');
  return this.find({}, (function(_this) {
    return function(err, docs) {
      if (err) {
        throw err;
      }
      return mc.set('posts', JSON.stringify(docs), cb);
    };
  })(this));
};

PostSchema.statics.fetchAndCache = function(cb) {
  return this.fetchNew((function(_this) {
    return function(err, docs) {
      return _this.flushCache(function(err2, num) {
        return typeof cb === "function" ? cb(err2 || err, num) : void 0;
      });
    };
  })(this));
};

module.exports = mongoose.model("Post", PostSchema);

var PostSchema, api, authTypes, crypto, findOrCreate, getPostsWithTags, memjs, mongoose, _;

mongoose = require('mongoose');

crypto = require('crypto');

memjs = require('memjs');

_ = require('underscore');

authTypes = [];

api = require('./../api');

findOrCreate = require('./lib/findOrCreate');

PostSchema = new mongoose.Schema({
  tags: Array,
  tumblrUrl: String,
  tumblrPostType: String,
  date: Date,
  body: String,
  isHosted: Boolean,
  data: {
    title: String
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

PostSchema.virtual('path').get(function() {
  return "/#posts/{id}".replace(/{id}/, this.tumblrId);
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

module.exports = mongoose.model("Post", PostSchema);
