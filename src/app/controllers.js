var Post, Resource, User, mongoose, required;

mongoose = require('mongoose');

required = require('../lib/required');

Resource = mongoose.model('Resource');

Post = Resource.model('Post');

User = Resource.model('User');

module.exports = {
  '/': {
    name: 'index',
    get: function(req, res, next) {
      if (req.user) {
        req.user.lastUpdate = new Date();
        res.render('pages/main', {
          user_profile: req.user
        });
        return req.user.save();
      } else {
        return res.render('pages/front');
      }
    }
  },
  '/entrar': {
    get: function(req, res) {
      return res.redirect('/api/auth/facebook');
    }
  },
  '/settings': {
    name: 'settings',
    permissions: [required.login],
    get: function(req, res) {
      return res.render('pages/settings', {});
    }
  },
  '/tags/:tagId': {
    permissions: [required.login],
    get: function(req, res) {
      return res.render('pages/tag', {
        profile: req.user,
        follows: bool
      });
    }
  },
  '/u/:username': {
    name: 'profile',
    get: [
      required.login, function(req, res) {
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
    ]
  },
  '/posts/:postId': {
    name: 'profile',
    permissions: [required.login],
    get: function(req, res) {
      var postId;
      if (!(postId = req.paramToObjectId('postId'))) {
        return;
      }
      return Post.findOne({
        _id: postId
      }, req.handleErrResult(function(post) {
        if (post.parentPost) {
          return res.render404();
          console.log('redirecting', post.path);
          return res.redirect(post.path);
        } else {
          return post.stuff(req.handleErrResult(function(stuffedPost) {
            return res.render('pages/blogPost.html', {
              post: stuffedPost
            });
          }));
        }
      }));
    }
  },
  '/posts/:postId/edit': {
    permissions: [required.login],
    get: function(req, res) {
      return res.redirect('/#posts/' + req.params.postId + '/edit');
    }
  },
  '/equipe': {
    name: 'team',
    get: function(req, res) {
      return res.render('pages/about_pages/team');
    }
  },
  '/sobre': {
    name: 'about',
    get: function(req, res) {
      return res.render('pages/about_pages/about');
    }
  }
};
