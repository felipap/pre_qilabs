
# models/subscriber.coffee
# for meavisa.org, by @f03lipe

mongoose = require 'mongoose'

# Schema
SubscriberSchema = new mongoose.Schema {
		email: String
		authorized: { type: Boolean, default: false }
	}, { id: true } # default


# Methods
SubscriberSchema.methods = {}

SubscriberSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = mongoose.model "Subscriber", SubscriberSchema