
/*
TODO:
✔ Implement fan-out write for active users
- and fan-out read for non-active users.
See http://blog.mongodb.org/post/65612078649
 */
var Inbox, InboxSchema, Types, async, mongoose;

mongoose = require('mongoose');

async = require('async');

Types = {
  Post: 'Post'
};

InboxSchema = new mongoose.Schema({
  dateSent: {
    type: Date,
    index: true
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    index: true
  },
  author: {
    type: mongoose.Schema.ObjectId,
    index: true,
    ref: 'User'
  },
  resource: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post'
  },
  type: {
    type: String
  }
});

InboxSchema.statics.getFromUser = function(user, opts, cb) {
  if (cb == null) {
    cb = opts;
  }
  return this.find({
    author: user.id
  }).sort('-dateSent').exec(cb);
};

InboxSchema.statics.fillInboxes = function(opts, cb) {
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

InboxSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

module.exports = Inbox = mongoose.model("Inbox", InboxSchema);
