var assertArgs, mongoose,
  __slice = [].slice;

mongoose = require('mongoose');

assertArgs = function() {
  var allAssertions, args, assertParam, callback, err, index, paramAssertions, _i, _j, _len;
  allAssertions = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), args = arguments[_i++];
  assertParam = function(el, assertions) {
    var ans, assertContains, assertIsModel, err, type;
    assertIsModel = function(expected, value) {
      var model;
      if (expected.schema && expected.schema instanceof mongoose.Schema) {
        model = expected;
      } else if (typeof expected === 'string') {
        model = mongoose.model(expected);
      } else {
        return "Invalid expected value for assertion of type 'ismodel': " + expected;
      }
      if (value instanceof model) {
        return false;
      }
      return "Argument '" + value + "'' doesn't match Assert {ismodel:" + expected + "}";
    };
    assertContains = function(expected, value) {
      var key, keys, _j, _len;
      if (expected instanceof Array) {
        keys = expected;
      } else if (typeof expected === 'string') {
        keys = [expected];
      } else {
        return "Invalid expected value for assertion of type 'contains': " + expected;
      }
      for (_j = 0, _len = keys.length; _j < _len; _j++) {
        key = keys[_j];
        if (!(key in value)) {
          return "Argument '" + value + "' doesn't match Assert {contains:" + expected + "}";
        }
      }
      return false;
    };
    for (type in assertions) {
      ans = assertions[type];
      switch (type) {
        case 'ismodel':
          err = assertIsModel(ans, el);
          break;
        case 'contains':
          err = assertContains(ans, el);
          break;
        default:
          return "Invalid assertion of type " + type;
      }
      if (err) {
        return err;
      }
    }
    return null;
  };
  callback = args[args.length - 1];
  for (index = _j = 0, _len = allAssertions.length; _j < _len; index = ++_j) {
    paramAssertions = allAssertions[index];
    err = assertParam(args[index], paramAssertions);
    if (err) {
      console.warn("AssertLib error on index " + index + ":", err);
      return callback({
        error: true,
        msg: err
      });
    }
  }
};

module.exports = assertArgs;
