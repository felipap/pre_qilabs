var UserSchema, authTypes, crypto, findOrCreate, mongoose, _;

mongoose = require('mongoose');

crypto = require('crypto');

_ = require('underscore');

authTypes = [];

UserSchema = new mongoose.Schema({
  name: {
    type: String
  },
  tags: {
    type: Array,
    "default": []
  },
  facebookId: {
    type: String
  },
  accessToken: {
    type: String
  },
  lastUpdate: {
    type: Date,
    "default": Date(0)
  }
}, {
  id: true
});

UserSchema.methods = {};

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

UserSchema.statics.findOrCreate = findOrCreate;

module.exports = mongoose.model("User", UserSchema);
