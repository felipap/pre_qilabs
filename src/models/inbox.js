
/*
TODO:
✔ Implement fan-out write for active users
- and fan-out read for non-active users.
See http://blog.mongodb.org/post/65612078649
 */
var Inbox, InboxSchema, Types, assertArgs, async, mongoose;

mongoose = require('mongoose');

async = require('async');

assertArgs = require('./lib/assertArgs');

Types = {
  Post: 'Post'
};

InboxSchema = new mongoose.Schema({
  dateSent: {
    type: Date,
    indexed: 1
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    indexed: 1,
    required: true
  },
  resource: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resource',
    required: true
  }
});

InboxSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

InboxSchema.statics.fillInboxes = function(recipients, opts, cb) {
  console.log(recipients instanceof Array);
  assertArgs({
    '$isA': Array
  }, {
    $contains: ['resource']
  }, '$isCb');
  if (!recipients.length) {
    return cb(false, []);
  }
  return async.mapLimit(recipients, 5, ((function(_this) {
    return function(rec, done) {
      var inbox;
      inbox = new Inbox({
        resource: opts.resource,
        recipient: rec
      });
      return inbox.save(done);
    };
  })(this)), cb);
};

InboxSchema.statics.Types = Types;

InboxSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Inbox = mongoose.model("Inbox", InboxSchema);
