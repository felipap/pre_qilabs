var PostSchema, mongoose;

mongoose = require('mongoose');

PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group'
  },
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
