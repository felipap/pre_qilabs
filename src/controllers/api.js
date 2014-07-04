
/*
The controller for /api/* calls.
 */
var Subscriber, mongoose;

mongoose = require('mongoose');

Subscriber = mongoose.model('Subscriber');

module.exports = {
  children: {
    'session': require('./api_session'),
    'posts': require('./api_posts'),
    'users': require('./api_users'),
    'me': require('./api_me')
  }
};
