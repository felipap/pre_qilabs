
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/madb');

// Keep user as last one.
var models = ['inbox', 'notification', 'follow', 'post', 'subscriber', 'tag', 'activity', 'topic', 'group', 'user'];
for (var i=0; i<models.length; i++)
	require('../models/'+models[i]);

module.exports = mongoose;