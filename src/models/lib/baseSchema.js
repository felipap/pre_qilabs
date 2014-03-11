var BaseSchema, mongoose, util;

mongoose = require('mongoose');

util = require('util');

BaseSchema = function() {
  return mongoose.Schema.apply(this, arguments);
};

util.inherits(BaseSchema, mongoose.Schema);
