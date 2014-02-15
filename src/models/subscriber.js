var Subscribe, SubscriberSchema, mongoose;

mongoose = require('mongoose');

SubscriberSchema = new mongoose.Schema({
  email: String,
  authorized: {
    type: Boolean,
    "default": false
  }
}, {
  id: true
});

SubscriberSchema.statics.findOrCreate = require('./lib/findOrCreate');

module.exports = Subscribe = mongoose.model("Subscriber", SubscriberSchema);
