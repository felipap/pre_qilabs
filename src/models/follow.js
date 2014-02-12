var FollowSchema, mongoose;

mongoose = require('mongoose');

FollowSchema = new mongoose.Schema({
  dateStarted: Date,
  follower: {
    type: mongoose.Schema.ObjectId,
    index: 1
  },
  followee: {
    type: mongoose.Schema.ObjectId,
    index: 1
  }
});

FollowSchema.pre('save', function(next) {
  if (this.dateStarted == null) {
    this.dateStarted = new Date;
  }
  return next();
});

module.exports = mongoose.model("Follow", FollowSchema);
