
# src/models/subscriber
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'

SubscriberSchema = new mongoose.Schema {
		email: String
		authorized: { type: Boolean, default: false }
	}, { id: true } # default

SubscriberSchema.statics.findOrCreate = require './lib/findOrCreate'

module.exports = Subscribe = mongoose.model "Subscriber", SubscriberSchema