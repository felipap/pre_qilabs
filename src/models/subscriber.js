var SubscriberSchema, mongoose;

mongoose = require('mongoose');

SubscriberSchema = new mongoose.Schema({
  email: String
}, {
  id: true
});

SubscriberSchema.methods = {};

SubscriberSchema.statics.findOrCreate = findOrCreate;

module.exports = mongoose.model("Subscriber", SubscriberSchema);
