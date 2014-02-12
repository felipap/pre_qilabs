module.exports = function(err, req, res, next) {
	console.error('Error stack:', err);
	res.render('pages/500', {
		user: req.user,
	});
}