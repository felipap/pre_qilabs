var Pages, Post, Posts, Tag, Tags, User, api, blog, blog_url, getPostsWithTags, posts, tags, tposts, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

_ = require('underscore');

api = require('./api.js');

User = require('./models/user.js');

Post = require('./models/post.js');

Tag = require('./models/tag.js');

blog_url = 'http://meavisa.tumblr.com';

blog = api.getBlog('meavisa.tumblr.com');

tags = [];

posts = [];

tposts = [];

api.pushBlogTags(blog, function(err, _tags) {
  var meta, tag, _results;
  if (err) {
    throw err;
  }
  tags = _tags;
  _results = [];
  for (tag in _tags) {
    meta = _tags[tag];
    _results.push(console.log('pushing found tag: #' + tag, _.keys(meta.children)));
  }
  return _results;
});

getPostsWithTags = function(tags, callback) {
  return api.getPostsWithTags(blog, tags, function(err, _posts) {
    posts = _posts;
    return typeof callback === "function" ? callback(err, _posts) : void 0;
  });
};

Tags = {
  get: function(req, res) {
    console.log('getting', JSON.stringify(Tag.checkFollowed(tags, req.user.tags)));
    return res.end(JSON.stringify(Tag.checkFollowed(tags, req.user.tags)));
  },
  post: function(req, res) {
    var checked;
    checked = req.body.checked;
    req.user.tags = checked;
    req.user.save();
    return res.end();
  },
  put: function(req, res) {
    var _ref;
    console.log('did follow');
    console.log('didn\'t follow');
    if (_ref = req.params.tag, __indexOf.call(req.user.tags, _ref) >= 0) {
      req.user.tags.splice(req.user.tags.indexOf(req.params.tag), 1);
    } else {
      req.user.tags.push(req.params.tag);
    }
    req.user.save();
    return res.end();
  },
  template: function(req, res) {
    res.set({
      'Content-Type': 'text/plain'
    });
    return res.sendfile(__dirname + '/views/tmpls/tag.html');
  }
};

Posts = {
  get: function(req, res) {
    var seltags;
    console.log(req.query.tags);
    if (req.query.tags) {
      seltags = req.query.tags.split(',');
    } else {
      seltags = req.user.tags;
    }
    return getPostsWithTags(seltags, function(err, tposts) {
      console.log('returning', tposts);
      return res.end(JSON.stringify(tposts));
    });
  },
  template: function(req, res) {
    res.set({
      'Content-Type': 'text/plain'
    });
    return res.sendfile(__dirname + '/views/tmpls/post.html');
  }
};

Pages = {
  index: {
    get: function(req, res) {
      if (req.user) {
        req.user.lastUpdate = new Date();
        req.user.save();
        console.log(tposts, JSON.stringify(tposts));
        return getPostsWithTags(req.user.tags, function(err, tposts) {
          return res.render('pages/home', {
            user: req.user,
            tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags)),
            posts: tposts,
            blog_url: blog_url,
            messages: [JSON.stringify(req.user), JSON.stringify(req.session)]
          });
        });
      } else {
        return User.find().sort({
          '_id': 'descending'
        }).limit(10).find(function(err, data) {
          return res.render('pages/frontpage', {
            latestSignIns: data,
            messages: [JSON.stringify(req.session)]
          });
        });
      }
    },
    post: function(req, res) {
      return res.end('<html><head></head><body><script type="text/javascript">' + 'window.top.location="http://meavisa.herokuapp.com";</script>' + '</body></html>');
    }
  },
  about_get: function(req, res) {
    return res.render('pages/about', {
      user: req.user
    });
  },
  panel: {
    get: function(req, res) {
      return res.render('pages/panel', {
        user: req.user
      });
    },
    post: function(req, res) {}
  },
  logout: {
    get: function(req, res) {
      if (!req.user) {
        return res.redirect('/');
      }
      req.logout();
      return res.redirect('/');
    }
  },
  leave: {
    get: function(req, res) {
      return req.user.remove(function(err, data) {
        if (err) {
          throw err;
        }
        req.logout();
        return res.redirect('/');
      });
    }
  },
  dropall: {
    get: function(req, res) {
      var waiting;
      waiting = 3;
      console.log('you there');
      User.remove({
        id: 'a'
      }, function(err) {
        res.write("users removed");
        if (!--waiting) {
          return res.end(err);
        }
      });
      Post.remove({
        id: 'a'
      }, function(err) {
        res.write("\nposts removed");
        if (!--waiting) {
          return res.end(err);
        }
      });
      return Tag.remove({
        id: 'a'
      }, function(err) {
        res.write("\nposts removed");
        if (!--waiting) {
          return res.end(err);
        }
      });
    }
  },
  session: {
    get: function(req, res) {
      if (!req.user || req.user.facebookId !== process.env.facebook_me) {
        return res.redirect('/');
      }
      return User.find({}, function(err, users) {
        return Post.find({}, function(err, posts) {
          var obj;
          obj = {
            ip: req.ip,
            session: req.session,
            users: users,
            posts: posts
          };
          return res.end(JSON.stringify(obj));
        });
      });
    }
  }
};

module.exports = {
  Pages: Pages,
  Posts: Posts,
  Tags: Tags
};
