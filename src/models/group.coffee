
# src/models/group
# Copyright QILabs.org
# by @f03lipe

###
Membership is accessible at Group.Membership
###

################################################################################
################################################################################

mongoose = require 'mongoose'

# Schema
GroupSchema = new mongoose.Schema {
	name:		{ type: String, }
	tags:		{ type: Array, default: [] }
	firstAccess: Date
	affiliation: '' 				# institution, project, NGOs etc
	type: ''
}, { id: true } # default

MembershipSchema = new mongoose.Schema {
	joinDate: 	Date,
	member:		{ type: mongoose.Schema.ObjectId, index: 1, ref: 'User' }
	group: 		{ type: mongoose.Schema.ObjectId, index: 1, ref: 'Group' }
}

# Methods
GroupSchema.methods.addUserToGroup = (user, group, cb) ->
	MembershipSchema

GroupSchema.statics.findOrCreate = require('./lib/findOrCreate')
GroupSchema.statics.Membership = Membership = mongoose.model "Membership", MembershipSchema

module.exports = mongoose.model "Group", GroupSchema