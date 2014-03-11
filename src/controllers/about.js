module.exports = {
  name: 'about',
  methods: {
    get: function(req, res) {
      return res.render('about_pages/about');
    }
  },
  children: {
    'equipe': {
      name: 'team',
      methods: {
        get: function(req, res) {
          return res.render('about_pages/team');
        }
      }
    },
    'participe': {
      name: 'join_team',
      methods: {
        get: function(req, res) {
          return res.render('about_pages/jointeam');
        }
      }
    }
  }
};
