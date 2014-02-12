var Inbox, Post, Subscriber, Tag, User, posts, required, tags;

User = require('./models/user.js');

Post = require('./models/post.js');

Tag = require('./models/tag.js');

Subscriber = require('./models/subscriber.js');

Inbox = require('./models/inbox.js');

tags = [];

posts = [];

Tag.fetchAndCache();

Post.fetchAndCache();

required = require('./lib/required.js');

module.exports = {
  '/': {
    name: 'index',
    methods: {
      get: function(req, res) {
        if (req.user) {
          req.user.lastUpdate = new Date();
          req.user.save();
          return Inbox.find({}, function(err, docs) {
            console.log('oo', arguments);
            return res.render('pages/timeline', {
              tags: Tag.checkFollowed(tags, req.user.tags),
              posts: '' + err + docs
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
  '/tags/:tag': {
    methods: {
      get: function(req, res) {}
    }
  },
  '/p/:user': {
    methods: {
      get: function(req, res) {
        if (!req.params.user) {
          res.redirect('/404');
        }
        return User.genProfileFromUsername(req.params.user, function(err, profile) {
          if (err || !profile) {
            res.redirect('/404');
          }
          console.log('profile', err, profile);
          return req.user.doesFollowId(profile.id, function(err, bool) {
            return res.render('pages/profile', {
              profile: profile,
              follows: bool
            });
          });
        });
      }
    },
    name: 'profile'
  },
  '/404': {
    name: '404',
    methods: {
      get: function(req, res) {
        res.status(404);
        if (req.accepts('html')) {
          return res.status(404).render('pages/404', {
            url: req.url,
            user: req.user
          });
        } else if (req.accepts('json')) {
          res.status(404).send({
            error: 'Not found'
          });
        }
      }
    }
  },
  '/sobre': require('./controllers/about'),
  '/api': require('./controllers/api'),
  '/auth': require('./controllers/auth')
};
