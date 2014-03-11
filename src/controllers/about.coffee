
# Starts at /sobre
module.exports = {
	name: 'about'
	methods:
		get: (req, res) -> res.render('about_pages/about')
	children:
		'equipe':
			name: 'team'
			methods:
				get: (req, res) -> res.render('about_pages/team'),
		'participe':
			name: 'join_team'
			methods:
				get: (req, res) -> res.render('about_pages/jointeam'),
}