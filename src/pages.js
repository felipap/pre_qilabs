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
    name: 'panel',
    permissions: [required.login],
    get: function(req, res) {
      return res.render('guide', {});
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
        permissions: [required.labs.selfCanSee('slug')],
        get: function(req, res) {
          if (!req.params.slug) {
            return res.render404();
          }
          return Group.findOne({
            slug: req.params.slug
          }, req.handleErrResult(function(group) {
            return group.genGroupProfile(req.handleErrResult(function(groupProfile) {
              console.log('group', groupProfile);
              return res.render('pages/lab', {
                group: groupProfile
              });
            }));
          }));
        }
      }
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
  '/p/create': {
    methods: {
      get: function(req, res) {
        return res.render('pages/post_create');
      }
    }
  },
  '/posts/:postId': {
    name: 'profile',
    get: [
      required.posts.selfCanSee('postId'), function(req, res) {
        var postId;
        if (!(postId = req.paramToObjectId('postId'))) {
          return;
        }
        return Post.findOne({
          _id: postId
        }, req.handleErrResult(function(post) {
          if (post.parentPost) {
            console.log('redirecting', post.path);
            return res.redirect(post.path);
          } else {
            return post.stuff(req.handleErrResult(function(stuffedPost) {
              return res.render('pages/post.html', {
                post: stuffedPost
              });
            }));
          }
        }));
      }
    ],
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
