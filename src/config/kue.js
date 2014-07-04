
var kue = require('kue')

kue.redis.createClient = function () {
	var redisUrl = url.parse(process.env.REDISTOGO_URL)
	var client = redis.createClient(redisUrl.port, redisUrl.hostname)
	if (redisUrl.auth)
		client.auth(redisUrl.auth.split(':')[1])
	return client
}

module.exports = kue.createQueue()