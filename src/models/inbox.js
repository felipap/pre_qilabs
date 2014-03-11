
/*
TODO:
✔ Implement fan-out write for active users
- and fan-out read for non-active users.
See http://blog.mongodb.org/post/65612078649
 */
var Inbox, InboxSchema, Types, assertArgs, async, hookedModel, mongoose;

mongoose = require('mongoose');

async = require('async');

hookedModel = require('./lib/hookedModel');

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
    indexed: 1,
    required: true
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  resource: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  type: {
    type: String,
    required: true
  }
});

InboxSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

InboxSchema.statics.fillInboxes = function(opts, cb) {
  assertArgs({
    $contains: ['recipients']
  });
  console.assert(opts && cb && opts.recipients instanceof Array && opts.resource && opts.type, "Get your programming straight.");
  if (!opts.recipients.length) {
    return cb(false, []);
  }
  return async.mapLimit(opts.recipients, 5, (function(rec, done) {
    var inbox;
    inbox = new Inbox({
      resource: opts.resource,
      type: opts.type,
      author: opts.author,
      recipient: rec
    });
    return inbox.save(done);
  }), cb);
};

InboxSchema.statics.Types = Types;

module.exports = Inbox = hookedModel("Inbox", InboxSchema);
