var Group, Post, Resource, Subscriber, User, mongoose, required, util;

mongoose = require('mongoose');

util = require('util');

required = require('./lib/required');

Resource = mongoose.model('Resource');

Post = Resource.model('Post');

User = Resource.model('User');

Group = Resource.model('Group');

Subscriber = mongoose.model('Subscriber');

module.exports = {
  '/': {
    name: 'index',
    get: function(req, res) {
      if (req.user) {
        req.user.lastUpdate = new Date();
        req.user.save();
        return req.user.genProfile(function(err, profile) {
          if (err) {
            console.log('Serving /. err:', err);
          }
          return res.render('pages/main', {
            user_profile: profile
          });
        });
      } else {
        return res.render('pages/frontpage');
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
    permissions: [required.login],
    get: function(req, res) {
      return res.render('pages/panel', {});
    }
  },
  '/guias/vestibular': {
    name: 'guia',
    permissions: [required.login],
    get: function(req, res) {
      return res.render('guide', {});
    }
  },
  '/tags/vestibular': {
    name: 'tag',
    permissions: [required.login],
    get: function(req, res) {
      return req.user.genProfile(function(err, profile) {
        return req.user.doesFollowUser(req.user, function(err, bool) {
          return res.render('pages/tag', {
            profile: profile,
            follows: bool
          });
        });
      });
    }
  },
  '/u/:username': {
    name: 'profile',
    methods: {
      get: function(req, res) {
        if (!req.params.username) {
          return res.render404();
        }
        return User.findOne({
          username: req.params.username
        }, req.handleErrResult(function(pUser) {
          return pUser.genProfile(function(err, profile) {
            if (err || !profile) {
              return res.render404();
            }
            return req.user.doesFollowUser(pUser, function(err, bool) {
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
  '/new/experience': {
    name: 'newExperience',
    get: function(req, res) {
      return res.render('pages/post_forms/experience');
    }
  },
  '/new/pergunta': {
    name: 'newQuestion',
    get: function(req, res) {
      return res.render('pages/post_forms/question');
    }
  },
  '/new/dica': {
    name: 'newTip',
    get: function(req, res) {
      return res.render('pages/post_forms/tip');
    }
  },
  '/posts/:postId': {
    name: 'profile',
    get: function(req, res) {
      return res.redirect('/#posts/' + req.params.postId);
    },
    children: {
      '/edit': {
        methods: {
          get: function(req, res) {}
        }
      }
    }
  },
  '/sobre': require('./controllers/about'),
  '/api': require('./controllers/api'),
  '/auth': require('./controllers/auth')
};
