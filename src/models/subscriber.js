var Subscriber, SubscriberSchema, mongoose;

mongoose = require('mongoose');

SubscriberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  authorized: {
    type: Boolean,
    "default": false
  },
  when: {
    type: Date,
    "default": Date.now
  }
}, {
  id: true
});

SubscriberSchema.statics.findOrCreate = require('./lib/findOrCreate');

SubscriberSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Subscriber = mongoose.model("Subscriber", SubscriberSchema);
