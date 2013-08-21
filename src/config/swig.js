
// config/messages.js
// for meavisa.org, by @f03lipe

var swig = require('swig');
var _ = require('underscore');

function setUpSwig() {

	swig.setFilter('daysFromToday', function (obj, arg) {
		return Math.round((new Date()-new Date(obj))/(1000*60*60*24));
	});

	swig.setFilter('slice', function (obj, arg) {
	});

	swig.setFilter('isEmpty', function (obj) {
		return _.isEmpty(obj);
	});

	swig.setFilter('in', function (obj, arg) {
		console.log(obj, 'in', arg)
		return (obj in arg) || ((arg instanceof Array) && arg.indexOf(obj) != -1);
	});

}

module.exports = setUpSwig