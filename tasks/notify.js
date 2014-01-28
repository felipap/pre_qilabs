var jobber;

jobber = require('./jobber.js')(function(e) {
  return require('../src/api.js').notifyNewPosts(function() {
    return e.quit(true);
  });
}).start();
