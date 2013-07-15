

var _ 	= require('underscore');
var api = require('./apis.js');
var User = require('./models/user.js');

var blog_url = 'http://meavisa.tumblr.com' // 'http://meavisa.tumblr.com'

var blog = api.getBlog("meavisa.tumblr.com");
// var twit = api.getTwitterApi();

// function notifyUser (user, tags) {
// 	var msg = "@"+user.screen_name+", he have updates on some tags ("+
// 		tags.slice(0,2)
// 		+") that you're following! Check your account on MeAvisa.herokuapp.com "
// 		+"account!"+Math.floor(Math.random()*100)
// 	console.log('processing ', user.screen_name, msg, '\n')
// 	twit.post('statuses/update', {
// 		status: msg
// 	}, function (err, reply) {
// 		console.log(err, reply)
// 		if (err) throw err;
// 	})
// }

onGetPosts = function (posts) {
	User.find({}, function (err, users) {
		users.forEach(function (user) {
			var tags = _.union.apply(null, _.pluck(_.filter(posts, function (post) {
					return new Date(post.date) > new Date(user.lastUpdate);
				}), 'tags'));

			if (tags.length)
				api.sendNotification(user._id, tags)
			
			user.lastUpdate = new Date(0);
			user.save();
		});
	});
}


db.openDb(function () {
	blog.posts(function (err, data) {
		if (err) throw err;
		onGetPosts(data.posts);
	})	
})

