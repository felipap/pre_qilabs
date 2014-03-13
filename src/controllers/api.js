
/*
The controller for /api/* calls.
 */
var Subscriber, mongoose;

mongoose = require('mongoose');

Subscriber = mongoose.model('Subscriber');

module.exports = {
  children: {
    'testers': {
      permissions: [required.logout],
      post: function(req, res) {
        var errors;
        req.assert('email', 'Email inválido.').notEmpty().isEmail();
        if (errors = req.validationErrors()) {
          req.flash('warn', 'Parece que esse email que você digitou é inválido. :O &nbsp;');
          return res.redirect('/');
        } else {
          return Subscriber.findOrCreate({
            email: req.body.email
          }, function(err, doc, isNew) {
            if (err) {
              req.flash('warn', 'Tivemos problemas para processar o seu email. :O &nbsp;');
            } else if (!isNew) {
              req.flash('info', 'Ops. Seu email já estava aqui! Adicionamos ele à lista de prioridades. :) &nbsp;');
            } else {
              req.flash('info', 'Sucesso! Entraremos em contato. \o/ &nbsp;');
            }
            return res.redirect('/');
          });
        }
      }
    },
    'session': require('./api_session'),
    'labs': require('./api_labs'),
    'posts': require('./api_posts'),
    'users': require('./api_users'),
    'me': require('./api_me')
  }
};
