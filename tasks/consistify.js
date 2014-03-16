var async, jobber, _;

async = require('async');

_ = require('underscore');

jobber = require('./jobber.js')(function(e) {
  var Activity, Group, Notification, Post, Resource, User, mongoose, testCount, tests, wrapTest;
  mongoose = require('mongoose');
  Notification = mongoose.model('Notification');
  Resource = mongoose.model('Resource');
  Activity = Resource.model('Activity');
  Post = Resource.model('Post');
  Group = Resource.model('Group');
  User = Resource.model('User');
  testCount = 0;
  tests = [
    function(next) {
      return Activity.find({}).populate('actor object target').exec((function(_this) {
        return function(err, docs) {
          var doc, incon, _i, _len;
          if (err) {
            console.warn(err);
          }
          incon = _.filter(docs, function(i) {
            return !i.actor || !i.object || !i.object;
          });
          console.log('Activities with obsolete actor/object/target found:', incon.length);
          for (_i = 0, _len = docs.length; _i < _len; _i++) {
            doc = docs[_i];
            doc.remove(function() {});
          }
          return next(err);
        };
      })(this));
    }, function(next) {
      return Activity.find({
        $not: {
          group: null
        }
      }).populate('group').exec((function(_this) {
        return function(err, docs) {
          if (err) {
            console.warn(err);
          }
          console.log('Activities with obsolete group found:', docs.length);
          return next(err);
        };
      })(this));
    }, function(next) {
      return Post.find({}).populate('author').exec((function(_this) {
        return function(err, docs) {
          var incon;
          if (err) {
            console.warn(err);
          }
          incon = _.filter(docs, function(i) {
            return !i.author;
          });
          console.log('Posts with obsolete author found:', docs.length);
          return next(err);
        };
      })(this));
    }, function(next) {
      return Post.find({
        $not: {
          group: null
        }
      }).populate('group').exec((function(_this) {
        return function(err, docs) {
          var incon;
          if (err) {
            console.warn(err);
          }
          incon = _.filter(docs, function(i) {
            return !i.group;
          });
          console.log('Posts with obsolete group found:', docs.length);
          return next(err);
        };
      })(this));
    }, function(next) {
      return Notification.find({}).populate('recipient agent').exec((function(_this) {
        return function(err, docs) {
          if (err) {
            console.warn(err);
          }
          console.log('Posts with obsolete group found:', docs.length);
          return next(err);
        };
      })(this));
    }, function(next) {
      return User.find({}).populate('memberships.group').exec((function(_this) {
        return function(err, users) {
          if (err) {
            console.warn(err);
          }
          console.log('Users with obsolete groups found:', incon.length);
          return next(err);
        };
      })(this));
    }
  ];
  wrapTest = function(test) {
    return function() {
      console.log("Starting test " + (testCount++) + ".");
      return test.apply(this, arguments);
    };
  };
  return async.series(_.map(tests, function(i) {
    return wrapTest(i);
  }), function(err, results) {
    console.log('err', err, 'results', results);
    return e.quit();
  });
}).start();
