var Subscriber, SubscriberSchema, mongoose;

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

SubscriberSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = Subscriber = mongoose.model("Subscriber", SubscriberSchema);
