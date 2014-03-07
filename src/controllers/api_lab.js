
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
var Group, HandleErrResult, ObjectId, User, mongoose, required, _;

mongoose = require('mongoose');

_ = require('underscore');

ObjectId = mongoose.Types.ObjectId;

required = require('../lib/required.js');

Group = mongoose.model('Group');

User = mongoose.model('User');

HandleErrResult = function(res) {
  return function(cb) {
    return function(err, result) {
      if (err) {
        return res.status(400).endJson({
          error: true
        });
      } else if (!result) {
        return res.status(404).endJson({
          error: true,
          name: 404
        });
      } else {
        return cb.apply(cb, [].splice.call(arguments, 1));
      }
    };
  };
};

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
      permissions: [required.labs.userCanAccess('labId')],
      get: function(req, res) {
        var labId;
        if (!(labId = req.paramToObjectId('labId'))) {
          return;
        }
        return Group.findOne({
          _id: labId
        }, HandleErrResult(res)(function(group) {
          var opts;
          opts = {
            limit: 10
          };
          if (parseInt(req.query.page)) {
            opts.maxDate = parseInt(req.query.maxDate);
          }
          return req.user.getLabPosts(opts, group, HandleErrResult(res)(function(docs) {
            var minDate;
            if (docs.length === opts.limit) {
              minDate = docs[docs.length - 1].dateCreated.valueOf();
            } else {
              minDate = -1;
            }
            return res.endJson({
              data: docs,
              error: false,
              minDate: minDate
            });
          }));
        }));
      },
      post: function(req, res) {
        var groupId;
        if (!(groupId = req.paramToObjectId('labId'))) {
          return;
        }
        return req.user.createPost({
          groupId: groupId,
          content: {
            title: 'My conquest!' + Math.floor(Math.random() * 100),
            body: req.body.content.body
          }
        }, HandleErrResult(res)(function(doc) {
          return doc.populate('author', function(err, doc) {
            return res.endJson({
              error: false,
              data: doc
            });
          });
        }));
      }
    },
    ':labId/addUser/:userId': {
      permissions: [required.labs.userCanAccess('labId')],
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
        }, HandleErrResult(res)(function(group) {
          return User.findOne({
            _id: userId
          }, HandleErrResult(res)(function(user) {
            var type;
            type = Group.Membership.Types.Member;
            return req.user.addUserToGroup(user, group, type, function(err, membership) {
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
