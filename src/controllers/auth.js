var passport;

passport = require('passport');

module.exports = {
  'facebook/callback': {
    methods: {
      get: passport.authenticate('facebook', {
        successRedirect: '/',
        failureRedirect: '/login'
      })
    }
  },
  'facebook': {
    methods: {
      get: passport.authenticate('facebook')
    }
  }
};
