module.exports = {
  name: 'about',
  methods: {
    get: function(req, res) {
      return res.render('pages/about');
    }
  },
  children: {
    'equipe': {
      name: 'team',
      methods: {
        get: function(req, res) {
          return res.render('pages/about_team');
        }
      }
    },
    'participe': {
      name: 'join-team',
      methods: {
        get: function(req, res) {
          return res.render('pages/about_jointeam');
        }
      }
    }
  }
};
