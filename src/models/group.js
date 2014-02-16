
/*
Membership is accessible at Group.Membership
 */
var GroupSchema, Membership, MembershipSchema, MembershipTypes, Types, mongoose;

mongoose = require('mongoose');

Types = {
  StudyGroup: 'StudyGroup'
};

GroupSchema = new mongoose.Schema({
  slug: String,
  creationDate: Date,
  affiliation: '',
  type: String,
  profile: {
    name: {
      type: String,
      required: true
    },
    description: String
  }
}, {
  id: true
});

MembershipTypes = {
  Moderator: 'Moderator',
  Member: 'Member'
};

MembershipSchema = new mongoose.Schema({
  joinDate: Date,
  type: {
    type: String,
    required: true
  },
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

GroupSchema.virtual('path').get(function() {
  return '/labs/' + this.slug;
});

GroupSchema.pre('save', function(next) {
  if (this.slug == null) {
    this.slug = '' + this.id;
  }
  if (this.creationDate == null) {
    this.creationDate = new Date;
  }
  return next();
});

MembershipSchema.pre('save', function(next) {
  if (this.joinDate == null) {
    this.joinDate = new Date;
  }
  return next();
});

GroupSchema.methods.addUser = function(user, cb) {
  var membership;
  membership = new Membership({
    user: user,
    group: this,
    member: MembershipTypes.Member
  });
  return membership.save(cb);
};

GroupSchema.methods.genGroupProfile = function(cb) {
  return cb(false, this.toObject());
};

MembershipSchema.statics.Types = MembershipTypes;

GroupSchema.statics.Types = Types;

GroupSchema.statics.findOrCreate = require('./lib/findOrCreate');

GroupSchema.statics.Membership = Membership = mongoose.model("Membership", MembershipSchema);

module.exports = mongoose.model("Group", GroupSchema);
