var Post, Subscriber, Tag, User, posts, required, tags;

User = require('./models/user.js');

Post = require('./models/post.js');

Tag = require('./models/tag.js');

Subscriber = require('./models/subscriber.js');

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
          return res.redirect('/feed');
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
    name: 'index',
    methods: {
      get: [
        required.login, function(req, res) {
          if (req.user) {
            req.user.lastUpdate = new Date();
            req.user.save();
            return Tag.getAll(function(err, tags) {
              return res.render('pages/home', {
                tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
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
        return res.render('pages/profile', {});
      }
    },
    name: 'profile'
  },
  '/sobre': require('./controllers/about'),
  '/api': require('./controllers/api'),
  '/auth': require('./controllers/auth')
};
