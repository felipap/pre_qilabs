
module.exports = {
	name: 'about',
	get: function(req, res) {
		return res.render('about_pages/about');
	},
	children: {
		// 'equipe': {
		// 	name: 'team',
		// 	get: function(req, res) {
		// 		return res.render('about_pages/team');
		// 	}
		// },
	}
};
