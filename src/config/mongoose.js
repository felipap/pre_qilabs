
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/madb');

module.exports = mongoose;