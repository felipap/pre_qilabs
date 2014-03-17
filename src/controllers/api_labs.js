
/*
The controller for /api/labs/* calls.
 */

/*
GUIDELINES for development:
- Keep controllers sanitized ALWAYS.
- Never pass request parameters or data to schema methods, always validate
  before. Use res.paramToObjectId to get create ids:
  `(req, res) -> return unless userId = res.paramToObjectId('userId'); ...`
- Prefer no not handle creation/modification of documents. Leave those to
  schemas statics and methods.
 */
var Group, ObjectId, Post, Resource, User, mongoose, required, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

_ = require('underscore');

ObjectId = mongoose.Types.ObjectId;

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

Group = Resource.model('Group');

User = Resource.model('User');

Post = Resource.model('Post');

module.exports = {
  permissions: [required.login],
  post: function(req, res) {
    return req.user.createGroup({
      profile: {
        name: req.body.name
      }
    }, function(err, doc) {
      if (err) {
        req.flash('err', err);
        if (err) {
          res.redirect('/labs/create');
        }
        return;
      }
      return res.redirect('/labs/' + doc.id);
    });
  },
  children: {
    ':labId/posts': {
      permissions: [required.labs.selfCanSee('labId')],
      get: function(req, res) {
        var labId;
        if (!(labId = req.paramToObjectId('labId'))) {
          return;
        }
        return Group.findOne({
          _id: labId
        }, req.handleErrResult(function(group) {
          var opts;
          opts = {
            limit: 10
          };
          if (parseInt(req.query.page)) {
            opts.maxDate = parseInt(req.query.maxDate);
          }
          return req.user.getLabPosts(opts, group, req.handleErrResult(function(docs, minDate) {
            if (minDate == null) {
              minDate = -1;
            }
            return res.endJson({
              data: docs,
              minDate: minDate
            });
          }));
        }));
      },
      post: [
        required.labs.selfIsMember('labId'), function(req, res) {
          var groupId, _ref;
          if (!(groupId = req.paramToObjectId('labId'))) {
            return;
          }
          if (_ref = !req.body.type, __indexOf.call(_.values(Post.Types), _ref) >= 0) {
            console.log('typo', req.body.type, 'invalido', _.values(Post.Types));
            return res.endJSON({
              error: true,
              type: 'InvalidPostType'
            });
          }
          return req.user.createPost({
            groupId: groupId,
            type: req.body.type,
            content: {
              title: req.body.content.title,
              body: req.body.content.body
            }
          }, req.handleErrResult(function(doc) {
            return doc.populate('author', function(err, doc) {
              return res.endJson({
                error: false,
                data: doc
              });
            });
          }));
        }
      ]
    },
    ':labId/addUser/:userId': {
      permissions: [required.labs.selfIsModerator('labId')],
      name: 'ApiLabAddUser',
      post: function(req, res) {
        var labId, userId;
        if (!(labId = req.paramToObjectId('labId'))) {
          return;
        }
        if (!(userId = req.paramToObjectId('userId'))) {
          return;
        }
        return Group.findOne({
          _id: labId
        }, req.handleErrResult(function(group) {
          return User.findOne({
            _id: userId
          }, req.handleErrResult(function(user) {
            return req.user.addUserToGroup(user, group, function(err, membership) {
              return res.endJson({
                error: !!err,
                membership: membership
              });
            });
          }));
        }));
      }
    }
  }
};
