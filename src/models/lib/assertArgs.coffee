
# Copyright 2014
# by @f03lipe

# Sample usage:
# notifyUser = (recpObj, agentObj, data, cb) ->
# 	assertArgs({$ismodel:'User'},{$ismodel:'User'},{$contains:['url','type']})

mongoose = require 'mongoose'

builtins =
	$isA:
		test: (value, expected) ->
			if expected instanceof Function 
				if value instanceof expected
					return false
			return "Argument '#{value}'' doesn't match '$isa': #{expected}"

	$isCb:
		test: (value) ->
			if value instanceof Function
				return false
			return "Argument '#{value}'' doesn't match 'isCb'"

	$isModel:
		test: (value, expected) ->
			# Try to turn expected value into model.
			if expected.schema and expected.schema instanceof mongoose.Schema 
				# Expect a model
				model = expected
			else if typeof expected is 'string'
				# Expect a string of the model's name
				model = mongoose.model(expected)
			else
				return "Invalid expected value for assertion of type '$ismodel': #{expected}"
			# Do it.
			if value instanceof model
				return false
			else if value instanceof mongoose.model('Resource') and value.__t is expected
				return false
			return "The following argument doesn't match {ismodel:#{expected}}: '#{JSON.stringify(value)}'"

	$contains:
		test: (value, expected) ->
			if expected instanceof Array
				keys = expected
			else if typeof expected is 'string'
				keys = [expected]
			else
				return "Invalid expected value for assertion of type 'contains': #{expected}"
			for key in keys
				unless key of value
					return "Argument '#{value}' doesn't match {$contains:#{expected}}" 
			return false

module.exports = assertArgs = (asserts...) -> # (asserts...)
	
	assertParam = (param, functionArg) ->

		# Support for unary tests like '$isCb'
		if typeof param is 'string'
			if param[0] is '$' and param of builtins
				if builtins[param].test.length is 1
					return err = builtins[param].test(functionArg)
				return "Type '#{param}' takes a non-zero number of arguments"
			return "Invalid assertion of type #{param}"

		# Support for many tests. Eg: {$contains:['a','b'], 'a':'$isCb', 'b':{$isA:Array}}
		for akey, avalue of param
			if akey[0] is '$'
				if akey of builtins
					err = builtins[akey].test(functionArg, avalue)
					if err then return err
				else
					return "Invalid assertion of type '#{akey}' on value #{functionArg}."
			else
				if functionArg.hasOwnProperty(akey)
					err = assertParam(avalue, functionArg[akey])
					if err then return "On attribute #{akey}. "+err
				else
					return "Attribute '#{akey}' not found in #{functionArg}."
		return null

	if ''+asserts[asserts.length-1] is '[object Arguments]'
		args = asserts.pop()
	else
		try
			args = arguments.callee.caller.arguments
		catch e
			throw "Can't use assertArgs inside strictmode."

	for paramAssertions, index in asserts
		err = assertParam(paramAssertions, args[index])
		if err
			console.trace()
			throw "AssertLib error on index #{index}: \"#{err}\"."