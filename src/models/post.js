var PostSchema, authTypes, crypto, findOrCreate, mongoose, _;

mongoose = require('mongoose');

crypto = require('crypto');

_ = require('underscore');

authTypes = [];

PostSchema = new mongoose.Schema({
  tumblrId: {
    type: Number
  },
  tags: {
    type: Array
  },
  urlTemplate: {
    type: String,
    "default": '/{id}'
  },
  tumblrUrl: {
    type: String
  },
  tumblrPostType: {
    type: String
  },
  date: {
    type: Date
  }
}, {
  id: false
});

PostSchema.virtual('path').get(function() {
  return this.urlTemplate.replace(/{id}/, this.id);
});

PostSchema.methods = {};

findOrCreate = function(conditions, doc, options, callback) {
  var self;
  if (arguments.length < 4) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else if (typeof doc === 'function') {
      callback = doc;
      doc = {};
      options = {};
    }
  }
  self = this;
  return this.findOne(conditions, function(err, result) {
    var obj;
    if (err || result) {
      if (options && options.upsert && !err) {
        return self.update(conditions, doc, function(err, count) {
          return self.findOne(conditions, function(err, result) {
            return callback(err, result, false);
          });
        });
      } else {
        return callback(err, result, false);
      }
    } else {
      conditions = _.extend(conditions, doc);
      obj = new self(conditions);
      return obj.save(function(err) {
        return callback(err, obj, true);
      });
    }
  });
};

PostSchema.statics.findOrCreate = findOrCreate;

module.exports = mongoose.model("Post", PostSchema);
