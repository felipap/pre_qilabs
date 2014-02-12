var PostSchema, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

PostSchema = new mongoose.Schema({
  author: mongoose.Schema.ObjectId,
  group: mongoose.Schema.ObjectId,
  dateCreated: Date,
  data: {
    title: String,
    body: String,
    tags: Array
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

PostSchema.virtual('path').get(function() {
  return "/post/{id}".replace(/{id}/, this.tumblrId);
});

PostSchema.pre('save', function(next) {
  if (this.dateCreated == null) {
    this.dateCreated = new Date;
  }
  return next();
});

PostSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = mongoose.model("Post", PostSchema);
