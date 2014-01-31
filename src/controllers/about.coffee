
# Starts at /sobre
module.exports = {
	name: 'about'
	methods:
		get: (req, res) -> res.render('pages/about')
	children:
		'equipe':
			name: 'team'
			methods:
				get: (req, res) -> res.render('pages/about_team'),
		'participe':
			name: 'join-team'
			methods:
				get: (req, res) -> res.render('pages/about_jointeam'),
}