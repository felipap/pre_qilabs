var Pages, Post, Posts, Tag, Tags, User, api, blog, blog_url, posts, tags, _,
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

Tag.fetchAndCache();

Tags = {
  get: function(req, res) {
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
  }
};

Posts = {};

Pages = {};

module.exports = {
  Pages: Pages,
  Posts: Posts,
  Tags: Tags
};
