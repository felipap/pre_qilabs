var GroupSchema, Membership, MembershipSchema, mongoose;

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
  member: {
    type: mongoose.Schema.ObjectId,
    index: 1,
    ref: 'User'
  },
  group: {
    type: mongoose.Schema.ObjectId,
    index: 1,
    ref: 'Group'
  }
});

GroupSchema.methods.addUserToGroup = function(user, group, cb) {
  return MembershipSchema;
};

GroupSchema.statics.findOrCreate = require('./lib/findOrCreate');

GroupSchema.statics.Membership = Membership = mongoose.model("Membership", MembershipSchema);

module.exports = mongoose.model("Group", GroupSchema);
