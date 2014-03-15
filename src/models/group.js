
/*
Membership is accessible at Group.Membership
 */
var Activity, Group, GroupSchema, Membership, MembershipSchema, MembershipTypes, Permissions, Resource, Types, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

Resource = mongoose.model('Resource');

Activity = mongoose.model('Activity');

Types = {
  StudyGroup: 'StudyGroup'
};

Permissions = {
  Public: 'Public',
  Private: 'Private'
};

MembershipTypes = {
  Moderator: 'Moderator',
  Member: 'Member'
};

GroupSchema = new Resource.Schema({
  slug: String,
  creationDate: Date,
  type: String,
  name: {
    type: String,
    required: true
  },
  profile: {
    description: String
  },
  visibility: {
    type: String,
    "default": Permissions.Public,
    "enum": _.values(Permissions)
  }
});

MembershipSchema = new Resource.Schema({
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
  return User.find({
    'groups.group': this
  }).exec((function(_this) {
    return function(err, docs) {
      return cb(err, _.extend({}, _this.toJSON(), {
        memberships: {
          count: docs.length,
          docs: docs.slice(20)
        }
      }));
    };
  })(this));
};

GroupSchema.statics.MembershipTypes = MembershipTypes;

MembershipSchema.statics.Types = MembershipTypes;

GroupSchema.statics.Types = Types;

GroupSchema.statics.Permissions = Permissions;

GroupSchema.statics.findOrCreate = require('./lib/findOrCreate');

GroupSchema.statics.Membership = Membership = mongoose.model("Membership", MembershipSchema);

GroupSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Group = Resource.discriminator("Group", GroupSchema);
