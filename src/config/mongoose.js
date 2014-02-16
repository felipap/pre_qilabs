
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/madb');

var models = ['follow', 'inbox', 'post', 'subscriber', 'tag', 'topic', 'group', 'user'];
for (var i=0; i<models.length; i++)
	require('../models/'+models[i]);

module.exports = mongoose;