
/*
Membership is accessible at Group.Membership
 */
var GroupSchema, Membership, MembershipSchema, MembershipTypes, Permissions, Types, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

Types = {
  StudyGroup: 'StudyGroup'
};

Permissions = {
  Public: 'Public',
  Private: 'Private'
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
  },
  permissions: {
    type: String,
    "default": Permissions.Private
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
  console.assert(_.values(MembershipSchema.statics.Types).indexOf(this.type) !== -1, "Invalid membership type: " + this.type);
  if (this.joinDate == null) {
    this.joinDate = new Date;
  }
  return next();
});

GroupSchema.methods.addUser = function(user, type, cb) {
  var membership;
  if (cb == null) {
    cb = type;
  }
  membership = new Membership({
    member: user,
    group: this,
    type: (cb && type) || MembershipTypes.Member
  });
  return membership.save(cb);
};

GroupSchema.methods.genGroupProfile = function(cb) {
  return Membership.find({
    group: this
  }).populate('member').exec((function(_this) {
    return function(err, docs) {
      return cb(err, _.extend({}, _this.toObject(), {
        memberships: docs
      }));
    };
  })(this));
};

MembershipSchema.statics.Types = MembershipTypes;

GroupSchema.statics.Types = Types;

GroupSchema.statics.Permissions = Permissions;

GroupSchema.statics.findOrCreate = require('./lib/findOrCreate');

GroupSchema.statics.Membership = Membership = mongoose.model("Membership", MembershipSchema);

module.exports = mongoose.model("Group", GroupSchema);
