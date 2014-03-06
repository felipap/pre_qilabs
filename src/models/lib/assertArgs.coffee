
# Sample usage:
# notifyUser = (recpObj, agentObj, data, cb) ->
# 	assertArgs({ismodel:'User'},{ismodel:'User'},{contains:['url','type']}, arguments)

mongoose = require 'mongoose'

assertArgs = (allAssertions..., args) ->
	assertParam = (el, assertions) ->
		assertIsModel = (expected, value) ->
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
		assertContains = (expected, value) ->
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

		for type, ans of assertions
			switch type
				when 'ismodel' then err = assertIsModel(ans, el)
				when 'contains' then err = assertContains(ans, el)
				else
					return "Invalid assertion of type #{type}"
			if err then return err
		return null
	
	callback = args[args.length-1]
	for paramAssertions, index in allAssertions
		err = assertParam(args[index], paramAssertions)
		if err
			console.warn "AssertLib error on index #{index}:", err
			return callback({error:true,msg:err})

module.exports = assertArgs