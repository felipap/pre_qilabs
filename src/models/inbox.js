var InboxSchema, mongoose;

mongoose = require('mongoose');

InboxSchema = new mongoose.Schema({
  dateSent: {
    type: Date,
    index: true
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    index: true
  },
  from: mongoose.Schema.ObjectId,
  post: String
});

InboxSchema.statics.getUserBoard = function(user, opts, cb) {
  if (cb == null) {
    cb = opts;
  }
  return this.find({
    from: user.id
  }).sort('-dateSent').exec(cb);
};

InboxSchema.statics.getUserInbox = function(user, opts, cb) {
  if (cb == null) {
    cb = opts;
  }
  return this.find({
    recipient: user.id
  }).sort('-dateSent').exec(cb);
};

InboxSchema.pre('save', function(next) {
  console.log('saving date:', this.dateSent);
  return next();
});

module.exports = mongoose.model("Inbox", InboxSchema);
