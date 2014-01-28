var jobber;

jobber = require('./jobber.js')(function(e) {
  return require('../src/models/post.js').fetchNew(function() {
    return e.quit(true);
  });
}).start();
