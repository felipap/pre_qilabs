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
  author: {
    type: mongoose.Schema.ObjectId,
    index: true,
    ref: 'User'
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post'
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

InboxSchema.pre('save', function(next) {
  if (this.dateSent == null) {
    this.dateSent = new Date();
  }
  return next();
});

module.exports = mongoose.model("Inbox", InboxSchema);
