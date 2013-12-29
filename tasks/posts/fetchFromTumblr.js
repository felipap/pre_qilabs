var jobber;

jobber = require('../jobber.js')(function(e) {
  var Post;
  console.log('Starting to fetch all posts.');
  Post = require('../../src/models/post.js');
  return Post.fetchNew(function(err, results) {
    console.log("Posts refetched and maintaned: " + results.length);
    return Post.flushCache(function(err2) {
      return e.quit(err || err2);
    });
  });
}).start();
