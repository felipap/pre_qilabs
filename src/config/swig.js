
// config/messages.js
// for meavisa.org, @f03lipe

var swig = require('swig');

function setUpSwig() {

	swig.setFilter('daysFromToday', function (obj, arg) {
		return Math.round((new Date()-new Date(obj))/(1000*60*60*24));
	});

	swig.setFilter('slice', function (obj, arg) {
	});

	swig.setFilter('in', function (obj, arg) {
		return obj in arg;
	});

}

module.exports = setUpSwig