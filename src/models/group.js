var GroupSchema, MembershipSchema, mongoose;

mongoose = require('mongoose');

GroupSchema = new mongoose.Schema({
  name: {
    type: String
  },
  tags: {
    type: Array,
    "default": []
  },
  firstAccess: Date,
  affiliation: '',
  type: ''
}, {
  id: true
});

MembershipSchema = new mongoose.Schema({
  joinDate: Date,
  member: mongoose.Schema.ObjectId,
  group: mongoose.Schema.ObjectId
});

GroupSchema.methods = {};

GroupSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = mongoose.model("Group", GroupSchema);
