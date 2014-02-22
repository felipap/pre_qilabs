var Post, PostSchema, PostTypes, mongoose, urlify;

mongoose = require('mongoose');

PostTypes = {
  Comment: 'Comment',
  Answer: 'Answer',
  PlainPost: 'PlainPost'
};

PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group'
  },
  dateCreated: {
    type: Date
  },
  type: {
    type: String,
    "default": PostTypes.PlainPost,
    required: true
  },
  parentPost: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    index: 1
  },
  points: {
    type: Number,
    "default": 0
  },
  data: {
    title: {
      type: String,
      required: false
    },
    body: {
      type: String,
      required: true
    },
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
  return "/posts/{id}".replace(/{id}/, this.id);
});

PostSchema.virtual('apiPath').get(function() {
  return "/api/posts/{id}".replace(/{id}/, this.id);
});

urlify = function(text) {
  var urlRegex;
  urlRegex = /(((https?:(?:\/\/)?)(?:www\.)?[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
  return text.replace(urlRegex, function(url) {
    return "<a href=\"" + url + "\">" + url + "</a>";
  });
};

PostSchema.virtual('data.unescapedBody').get(function() {
  if (this.data.body) {
    return urlify(this.data.body);
  } else {
    return '';
  }
});

PostSchema.pre('remove', function(next) {
  Post.remove({
    parentPost: this
  }, function(err, num) {
    return next();
  });
  return console.log('removing comments after removing this');
});

PostSchema.statics.deepRemove = function() {
  return console.log('removed?');
};

PostSchema.pre('save', function(next) {
  if (this.dateCreated == null) {
    this.dateCreated = new Date;
  }
  return next();
});

PostSchema.methods.getComments = function(cb) {
  if (!this.hasComments) {
    cb(false, []);
  }
  return Post.find({
    parentPost: this.id
  }).populate('author').exec(function(err, docs) {
    console.log('comment docs:', docs);
    return cb(err, docs);
  });
};

PostSchema.statics.PostTypes = PostTypes;

PostSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = Post = mongoose.model("Post", PostSchema);
