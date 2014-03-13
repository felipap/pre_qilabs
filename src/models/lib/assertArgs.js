var assertArgs, builtins, mongoose,
  __slice = [].slice;

mongoose = require('mongoose');

builtins = {
  $isA: {
    test: function(value, expected) {
      if (expected instanceof Function) {
        if (value instanceof expected) {
          return false;
        }
      }
      return "Argument '" + value + "'' doesn't match '$isa': " + expected;
    }
  },
  $isCb: {
    test: function(value) {
      if (value instanceof Function) {
        return false;
      }
      return "Argument '" + value + "'' doesn't match 'isCb'";
    }
  },
  $isModel: {
    test: function(value, expected) {
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
      } else if (value instanceof mongoose.model('Resource') && value.__t === expected) {
        return false;
      }
      return "Argument '" + value + "'' doesn't match Assert {ismodel:" + expected + "}";
    }
  },
  $contains: {
    test: function(value, expected) {
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
  var args, assertParam, asserts, e, err, index, paramAssertions, _i, _len, _results;
  asserts = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  assertParam = function(param, functionArg) {
    var akey, avalue, err;
    if (typeof param === 'string') {
      if (param[0] === '$' && param in builtins) {
        if (builtins[param].test.length === 1) {
          return err = builtins[param].test(functionArg);
        }
        return "Type '" + param + "' takes a non-zero number of arguments";
      }
      return "Invalid assertion of type " + param;
    }
    for (akey in param) {
      avalue = param[akey];
      if (akey[0] === '$') {
        if (akey in builtins) {
          err = builtins[akey].test(functionArg, avalue);
          if (err) {
            return err;
          }
        } else {
          return "Invalid assertion of type '" + akey + "' on value " + functionArg + ".";
        }
      } else {
        if (functionArg.hasOwnProperty(akey)) {
          err = assertParam(avalue, functionArg[akey]);
          if (err) {
            return ("On attribute " + akey + ". ") + err;
          }
        } else {
          return "Attribute '" + akey + "' not found in " + functionArg + ".";
        }
      }
    }
    return null;
  };
  if ('' + asserts[asserts.length - 1] === '[object Arguments]') {
    args = asserts.pop();
  } else {
    try {
      args = arguments.callee.caller["arguments"];
    } catch (_error) {
      e = _error;
      throw "Can't use assertArgs inside strictmode.";
    }
  }
  _results = [];
  for (index = _i = 0, _len = asserts.length; _i < _len; index = ++_i) {
    paramAssertions = asserts[index];
    err = assertParam(paramAssertions, args[index]);
    if (err) {
      console.trace();
      throw "AssertLib error on index " + index + ": \"" + err + "\".";
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};
