var jobber;

jobber = require('../jobber.js')(function(e) {
  console.log("About to drop all posts.");
  return e.checkContinue(function() {
    var Post;
    Post = require('../../src/models/post.js');
    return Post.remove({}, function(err, count) {
      console.log("Count affected: " + count + ".");
      return Post.flushCache(function(err2) {
        return e.quit(err || err2);
      });
    });
  });
}).start();
