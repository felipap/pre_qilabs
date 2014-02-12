var FollowSchema, mongoose;

mongoose = require('mongoose');

FollowSchema = new mongoose.Schema({
  dateBegin: Date,
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
  if (this.dateBegin == null) {
    this.dateBegin = new Date;
  }
  return next();
});

module.exports = mongoose.model("Follow", FollowSchema);
