
/*
The controller for /api/* calls.
 */

/*
GUIDELINES for development:
- Keep controllers sanitized ALWAYS.
- Never pass request parameters or data to schema methods, always validate
  before. Use res.paramToObjectId to get create ids:
  `(req, res) -> return unless userId = res.paramToObjectId('userId'); ...`
- Prefer no not handle creation/modification of documents. Leave those to
  schemas statics and methods.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
 */
var Activity, Follow, Group, Inbox, Notification, ObjectId, Post, Resource, Subscriber, User, mongoose, required, _;

mongoose = require('mongoose');

_ = require('underscore');

ObjectId = mongoose.Types.ObjectId;

required = require('../lib/required.js');

Activity = mongoose.model('Activity');

Inbox = mongoose.model('Inbox');

Notification = mongoose.model('Notification');

Subscriber = mongoose.model('Subscriber');

Resource = mongoose.model('Resource');

User = Resource.model('User');

Post = Resource.model('Post');

Group = Resource.model('Group');

Follow = Resource.model('Follow');

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
