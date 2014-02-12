
# models/group.coffee
# for qilabs.org, by @f03lipe

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
	member:		mongoose.Schema.ObjectId,
	group: 		mongoose.Schema.ObjectId,
}

# Virtuals

# Methods
GroupSchema.methods = {}

GroupSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = mongoose.model "Group", GroupSchema