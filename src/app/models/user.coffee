
# User module.

mongoose = require 'mongoose'
crypto = require 'crypto'
_ = require 'underscore'

authTypes = []

# Schema
UserSchema = new mongoose.Schema
	name:				type: String, default: ''
	# username:			type: String
	tags:				type: Array,  default: ''
	facebookId:			type: String, default: ''
	accessToken:		type: String, default: ''
	# salt:				type: String, default: ''
	# hashed_password:	type: String, default: ''


# Virtuals
# UserSchema
# 	.virtual('password')
# 	.set (password) ->
# 		@_password = password
# 		@salt = @makeSalt()
# 		@hashed_password = @encryptPassword(password)
# 	.get -> @_password

# Validations
validatePresenceOf = (value) -> value and value.length

# "If you are authenticating by any of the oauth strategies, don't validate"
# UserSchema.path('name').validate (name) ->
# 		if authTypes.indexOf(this.provider) is not -1
# 			return true
# 		return name.length
# 	, 'Name cannot be blank.'

# UserSchema.path("username").validate (username) ->
# 		# "If you are authenticating by any of the oauth strategies, don't validate"
# 		return true  if authTypes.indexOf(@provider) isnt -1
# 		username.length
# 	, "Username cannot be blank"

# UserSchema.path("hashed_password").validate (hashed_password) ->
# 		# "If you are authenticating by any of the oauth strategies, don't validate"
# 		return true if authTypes.indexOf(@provider) isnt -1
# 		hashed_password.length
# 	, "Password cannot be blank"


# Pre-save hook
# UserSchema.pre "save", (next) ->
# 	return next() unless @isNew
# 	if not validatePresenceOf(@password) and authTypes.indexOf(@provider) is -1
# 			next new Error("Invalid password")
# 	else next()

# Methods
UserSchema.methods =
	###
	Authenticate - check if the passwords are the same
		@param {String} plainText
		@return {Boolean}
		@api public
	###
	# authenticate: (plainText) ->
	# 	@encryptPassword(plainText) is @hashed_password

	###
	Make salt
		@return {String}
		@api public
	###
	makeSalt: ->
		Math.round((new Date().valueOf() * Math.random())) + ""

	###
	Encrypt password
		@param {String} password
		@return {String}
		@api public
	###

	encryptPassword: (password) ->
		return ""  unless password
		encrypred = undefined
		try
			encrypred = crypto.createHmac("sha1", @salt).update(password).digest("hex") 
			return encrypred
		catch err
			return ""

findOrCreate = (schema, options) ->
	schema.statics.findOrCreate = (conditions, doc, options, callback) ->
		if arguments.length < 4
			if typeof options is 'function' # Scenario: findOrCreate(conditions, doc, callback)
				callback = options
				options = {}
			else if typeof doc is 'function' # Scenario: findOrCreate(conditions, callback);
				callback = doc
				doc = {}
				options = {}
		
		self = this;
		@findOne conditions, (err, result) ->
			if err or result
				if options and options.upsert and not err
					self.update(conditions, doc, (err, count) ->
						self.findOne(conditions, (err, result) ->
							callback(err, result, false)
						)
					)
				else
					callback(err, result, false)
			else
				for key in doc
					conditions[key] = doc[key]
				obj = new self(conditions)
				obj.save (err) ->
					callback(err, obj, true)

UserSchema.plugin findOrCreate

module.exports = mongoose.model "User", UserSchema

console.log(module.exports.findOrCreate)
