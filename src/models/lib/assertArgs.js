var assertArgs, builtins, mongoose,
  __slice = [].slice;

mongoose = require('mongoose');

builtins = {
  $iscb: {
    test: function(expected, value) {
      if (value instanceof Function) {
        return false;
      }
      return "Argument '" + value + "'' doesn't match 'iscallable'";
    }
  },
  $ismodel: {
    test: function(expected, value) {
      var model;
      if (expected.schema && expected.schema instanceof mongoose.Schema) {
        model = expected;
      } else if (typeof expected === 'string') {
        model = mongoose.model(expected);
      } else {
        return "Invalid expected value for assertion of type '$ismodel': " + expected;
      }
      if (value instanceof model) {
        return false;
      }
      return "Argument '" + value + "'' doesn't match Assert {ismodel:" + expected + "}";
    }
  },
  $contains: {
    test: function(expected, value) {
      var key, keys, _i, _len;
      if (expected instanceof Array) {
        keys = expected;
      } else if (typeof expected === 'string') {
        keys = [expected];
      } else {
        return "Invalid expected value for assertion of type 'contains': " + expected;
      }
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        if (!(key in value)) {
          return "Argument '" + value + "' doesn't match Assert {$contains:" + expected + "}";
        }
      }
      return false;
    }
  }
};

module.exports = assertArgs = function() {
  var allAssertions, args, assertParam, callback, err, index, paramAssertions, _i, _j, _len;
  allAssertions = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), args = arguments[_i++];
  assertParam = function(assertionArg, functionArg) {
    var akey, avalue, err;
    for (akey in assertionArg) {
      avalue = assertionArg[akey];
      if (akey[0] === '$' && akey in builtins) {
        err = builtins[akey].test(avalue, functionArg);
        if (err) {
          return err;
        }
      } else if (functionArg.hasOwnProperty[akey]) {
        return assertParam(avalue, functionArg[akey]);
      } else {
        return "Invalid assertion of type " + akey;
      }
    }
    return null;
  };
  callback = args[args.length - 1];
  if (!(callback instanceof Function)) {
    throw "AssertLib error. Last element in the function arguments passed insn't callable.";
  }
  for (index = _j = 0, _len = allAssertions.length; _j < _len; index = ++_j) {
    paramAssertions = allAssertions[index];
    err = assertParam(paramAssertions, args[index]);
    if (err) {
      if (process.env.NODE_ENV === 'production') {
        console.warn("AssertLib error on index " + index + ":", err);
        return callback({
          error: true,
          msg: err
        });
      } else {
        console.trace();
        throw ("AssertLib error on index " + index + ":") + err + args.callee.name;
      }
    }
  }
};
