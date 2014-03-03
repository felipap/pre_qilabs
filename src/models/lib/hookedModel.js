var circumventionists, mongoose;

mongoose = require('mongoose');

circumventionists = ['findByIdAndUpdate', 'findOneAndUpdate', 'findOneAndRemove', 'findByIdAndUpdate'];

module.exports = function(name, schema, collection, skipInit) {
  var smname, _i, _len;
  for (_i = 0, _len = circumventionists.length; _i < _len; _i++) {
    smname = circumventionists[_i];
    schema.statics[smname] = function() {
      throw "Invalid static method call on hookedModel. Use document methods.";
    };
  }
  return mongoose.model(name, schema, collection, skipInit);
};
