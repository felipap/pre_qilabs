var Activity, Group, GroupSchema, MembershipTypes, Permissions, Resource, Types, mongoose, _;

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

GroupSchema.methods.genGroupProfile = function(cb) {
  var User;
  User = Resource.model('User');
  return User.find({
    'memberships.group': this
  }).exec((function(_this) {
    return function(err, docs) {
      return cb(err, _.extend({}, _this.toJSON(), {
        members: {
          count: docs.length,
          docs: docs.slice(20)
        }
      }));
    };
  })(this));
};

GroupSchema.statics.MembershipTypes = MembershipTypes;

GroupSchema.statics.Types = Types;

GroupSchema.statics.Permissions = Permissions;

GroupSchema.statics.findOrCreate = require('./lib/findOrCreate');

GroupSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Group = Resource.discriminator("Group", GroupSchema);
