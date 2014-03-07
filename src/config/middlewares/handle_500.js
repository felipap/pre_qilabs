module.exports = function(err, req, res, next) {
	console.error('Error stack:', err);

	if (err.status)
		res.status(err.status);
	if (res.statusCode < 400)
		res.status(500);
	if (req.app.get('env') != 'test')
		console.error(err.stack);

	var accept = req.headers.accept || '';

	if (req.app.get('env') === 'production') {
		res.render('pages/500', {
			user: req.user,
		});
	} else {
		
		if (~accept.indexOf('html')) {
			res.render('pages/500', {
				user: req.user,
				error_code: res.statusCode,
				error_msg: err,
				error_stack: (err.stack || '').split('\n').slice(1),
			});
		} else if (~accept.indexOf('json')) {
			var error = { message: err.message, stack: err.stack };
			for (var prop in err) error[prop] = err[prop];
			var json = JSON.stringify({ error: error });
			res.setHeader('Content-Type', 'application/json');
			res.end(json);
		} else { // plain text
			res.writeHead(res.statusCode, { 'Content-Type': 'text/plain' });
			res.end(err.stack);
		}
	}

}