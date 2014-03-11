var ResourceSchema, mongoose, util;

mongoose = require('mongoose');

util = require('util');

ResourceSchema = function() {
  return mongoose.Schema.apply(this, arguments);
};

util.inherits(ResourceSchema, mongoose.Schema);

module.exports = mongoose.model('Resource', new ResourceSchema);
