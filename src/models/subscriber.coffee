
# models/subscriber.coffee
# for qilabs.org, by @f03lipe

mongoose = require 'mongoose'

SubscriberSchema = new mongoose.Schema {
		email: String
		authorized: { type: Boolean, default: false }
	}, { id: true } # default

# Methods
SubscriberSchema.methods = {}

SubscriberSchema.statics.findOrCreate = require './lib/findOrCreate'

module.exports = mongoose.model "Subscriber", SubscriberSchema