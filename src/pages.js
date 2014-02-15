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
    console.log('result:', err, result);
    if (err) {
      console.log('err handled:', err);
      return res.status(400).endJson({
        error: true
      });
    } else if (!result) {
      return res.status(404).endJson({
        error: true,
        name: 404
      });
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
            return res.render('pages/timeline', {
              user_profile: profile
            });
          });
        } else {
          return User.find().sort({
            '_id': 'descending'
          }).limit(10).find(function(err, data) {
            return res.render('pages/frontpage', {
              latestSignIns: data
            });
          });
        }
      },
      post: function(req, res) {
        return res.end('<html><head></head><body><script type="text/javascript">' + 'window.top.location="http://meavisa.herokuapp.com"</script>' + '</body></html>');
      }
    }
  },
  '/feed': {
    name: 'feed',
    methods: {
      get: [
        required.login, function(req, res) {
          req.user.lastUpdate = new Date();
          req.user.save();
          return Tag.getAll(function(err, tags) {
            return res.render('pages/feed', {
              tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
            });
          });
        }
      ],
      post: function(req, res) {
        return res.end('<html><head></head><body><script type="text/javascript">' + 'window.top.location="http://meavisa.herokuapp.com"</script>' + '</body></html>');
      }
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
        methods: {
          get: function(req, res) {
            if (!req.params.slug) {
              return res.render404();
            }
            return Group.findOne({
              slug: req.params.slug
            }, HandleErrors(res, function(group) {
              return group.genGroupProfile(function(err, profile) {
                console.log(err, profile);
                return res.render('pages/lab', {
                  group: profile
                });
              });
            }));
          }
        }
      }
    }
  },
  '/u/:id': {
    name: 'profile',
    methods: {
      get: function(req, res) {
        if (!req.params.id) {
          return res.render404();
        }
        return User.findOne({
          username: username
        }, HandleErrors(res, function(user) {
          return user.genProfile(function(err, profile) {
            if (err || !profile) {
              return res.render404();
            }
            console.log('profile', err, profile);
            return req.user.doesFollowId(profile.id, function(err, bool) {
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
  '/post/:postId': {
    name: 'profile',
    methods: {
      get: function(req, res) {}
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
