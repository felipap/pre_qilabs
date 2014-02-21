var Group, HandleErrors, Inbox, Post, Subscriber, Tag, User, mongoose, required;

mongoose = require('mongoose');

required = require('./lib/required');

Post = mongoose.model('Post');

Inbox = mongoose.model('Inbox');

Tag = mongoose.model('Tag');

User = mongoose.model('User');

Group = mongoose.model('Group');

Subscriber = mongoose.model('Subscriber');

HandleErrors = function(res, cb) {
  console.assert(typeof cb === 'function');
  return function(err, result) {
    if (err) {
      console.log('err handled:', err);
      return res.status(400).endJson({
        error: true
      });
    } else if (!result) {
      return res.render404(404);
    } else {
      return cb(result);
    }
  };
};

module.exports = {
  '/': {
    name: 'index',
    methods: {
      get: function(req, res) {
        if (req.user) {
          req.user.lastUpdate = new Date();
          req.user.save();
          return req.user.genProfile(function(err, profile) {
            if (err) {
              console.log('err:', err);
            }
            return res.render('pages/timeline', {
              user_profile: profile
            });
          });
        } else {
          return res.render('pages/frontpage');
        }
      },
      post: function(req, res) {
        return res.end('<html><head></head><body><script type="text/javascript">' + 'window.top.location="http://meavisa.herokuapp.com"</script>' + '</body></html>');
      }
    }
  },
  '/feed': {
    name: 'feed',
    permissions: [required.login],
    get: function(req, res) {
      req.user.lastUpdate = new Date();
      req.user.save();
      return Tag.getAll(function(err, tags) {
        return res.render('pages/feed', {
          tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
        });
      });
    }
  },
  '/painel': {
    name: 'panel',
    methods: {
      get: [
        required.login, function(req, res) {
          return res.render('pages/panel', {});
        }
      ]
    }
  },
  '/labs': {
    permissions: [required.login],
    children: {
      'create': {
        methods: {
          get: function(req, res) {
            return res.render('pages/lab_create');
          }
        }
      },
      ':slug': {
        get: function(req, res) {
          if (!req.params.slug) {
            return res.render404();
          }
          return Group.findOne({
            slug: req.params.slug
          }, HandleErrors(res, function(group) {
            return group.genGroupProfile(function(err, groupProfile) {
              return res.render('pages/lab', {
                group: groupProfile
              });
            });
          }));
        }
      }
    }
  },
  '/p/:username': {
    name: 'profile',
    methods: {
      get: function(req, res) {
        if (!req.params.username) {
          return res.render404();
        }
        return User.findOne({
          username: req.params.username
        }, HandleErrors(res, function(user2) {
          return user2.genProfile(function(err, profile) {
            if (err || !profile) {
              return res.render404();
            }
            return req.user.doesFollowUser(user2, function(err, bool) {
              return res.render('pages/profile', {
                profile: profile,
                follows: bool
              });
            });
          });
        }));
      }
    }
  },
  '/posts/:postId': {
    name: 'profile',
    methods: {
      get: function(req, res) {
        var postId;
        if (!(postId = req.paramToObjectId('postId'))) {
          return;
        }
        return Post.findOne({
          _id: postId
        }).populate('group').exec(HandleErrors(res, function(post) {
          return res.render('pages/post.html', {
            post: post
          });
        }));
      }
    },
    children: {
      '/edit': {
        methods: {
          get: function(req, res) {}
        }
      }
    }
  },
  '/404': {
    name: '404',
    methods: {
      get: function(req, res) {
        return res.render404();
      }
    }
  },
  '/sobre': require('./controllers/about'),
  '/api': require('./controllers/api'),
  '/auth': require('./controllers/auth')
};
