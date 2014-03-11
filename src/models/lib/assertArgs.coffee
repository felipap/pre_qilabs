
# Copyright 2014
# by @f03lipe

# Sample usage:
# notifyUser = (recpObj, agentObj, data, cb) ->
# 	assertArgs({$ismodel:'User'},{$ismodel:'User'},{$contains:['url','type']}, arguments)

mongoose = require 'mongoose'

builtins =
	$iscb:
		test: (expected, value) ->
			if value instanceof Function
				return false
			return "Argument '#{value}'' doesn't match Assert {ismodel:#{expected}}"

	$ismodel:
		test: (expected, value) ->
			# Try to turn expected value into model.
			if expected.schema and expected.schema instanceof mongoose.Schema 
				# Expect a model
				model = expected
			else if typeof expected is 'string'
				# Expect a string of the model's name
				model = mongoose.model(expected)
			else
				return "Invalid expected value for assertion of type 'ismodel': #{expected}"
			# Do it.
			if value instanceof model
				return false
			return "Argument '#{value}'' doesn't match Assert {ismodel:#{expected}}"

	$contains:
		test: (expected, value) ->
			if expected instanceof Array
				keys = expected
			else if typeof expected is 'string'
				keys = [expected]
			else
				return "Invalid expected value for assertion of type 'contains': #{expected}"
			for key in keys
				unless key of value
					return "Argument '#{value}' doesn't match Assert {contains:#{expected}}" 
			return false

module.exports = assertArgs = (allAssertions..., args) ->
	
	assertParam = (assertionArg, functionArg) ->

		for type, ans of assertionArg
			if type of builtins
				err = builtins[type].test(ans, el)
				if err then return err
			else
				if process.env.NODE_ENV is 'production'
					return "Invalid assertion of type #{type}"
				else
					throw "Invalid assertion of type #{type}"
		return null
	
	# Expect last function argument to be the callback.
	callback = args[args.length-1]
	unless callback instanceof Function
		throw "AssertLib error. Last element in function arguments passed insn't callable."

	for paramAssertions, index in allAssertions
		err = assertParam(args[index], paramAssertions)
		if err
			console.warn "AssertLib error on index #{index}:", err
			return callback({error:true,msg:err})