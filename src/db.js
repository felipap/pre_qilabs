

var mongo 	= require('mongodb'),
	Server 	= mongo.Server,
	Db 		= mongo.Db,
	BSON 	= mongo.BSONPure;

COLLNAME = 'signers';

var _exports = exports,
	db, server; // to be assigned in connect


var mongoUri = process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/madb';


function tryCollection (db, collname, callback) {
	db.collection(collname, {strict:true}, function (err, collection) {
	if (err) {
		db.createCollection(collname, { capped: false });
		console.log('The "'+collname+'" collection didn\'t exist. Til now.');
	}
	// else
	// 	_getAll(collname, function (items) {
	// 		console.log('Database started with items:', items);
	// 	})
	callback(db, collection);
});
}


function _connect (dbname, collname, callback) {
	mongo.Db.connect(mongoUri, function (err, database) {
		db = database;
		if (err) throw err;
		console.log("Connected to '"+dbname+"' database.");
		tryCollection(db, collname, callback);
	}); 
}

function _addObj (obj, collname, callback) {
	db.collection(collname, function (err, collection) {
		collection.insert(obj, {safe:true}, function (err, results) {
			if (err) throw err;
			callback(results);
		})
	});
}

function _getAll (collname, callback) {
	db.collection(collname, function (err, collection) {
		if (err) throw err;
		collection.find().toArray(function (err, items) {
			callback(items);
		})
	})
}

function _findObj (query, collname, callback) {
	db.collection(collname, function (err, collection) {
		collection.find(query).toArray(function (err, items) {
			callback(items);
		})
	})
}

function _updateObj (obj, collname, callback) {
	db.collection(collname, function (err, collection) {
		if (err) throw err;
		obj._id = obj._id.toString();
		obj._id = mongo.ObjectID(obj._id);
		collection.save(obj, {safe:true}, function(err, result) {
			if (err) throw err;
			callback(obj);
		});
	});
}

function _close (callback) {
	db.close();
	callback();
}


module.exports = {
	
	connect: function (callback, coll) {
		_connect('madb', coll||'signers', callback||function(){});
		return module.exports;
	},

	close: function (callback) {
		_close(callback||function(){});
		return module.exports;
	},

	updates: {

	},
	
	signers: {

		addUser: function (user, callback) {
			_findObj({twitter_id: user.twitter_id}, 'signers', function (result) {
				// console.log('result', result);
				if (!result[0]) {
					_addObj(user, 'signers', function (objs) {
						console.log('User %s added.', user.twitter_id);
						if (callback) callback(objs[0]);
					});
				} else {
					console.log('Duplicated user %s.', user.twitter_id);
					if (callback) callback(result[0]);
				}
			})
			return module.exports;
		},
		
		getAll: function (callback, coll) {
			console.log('getting all');
			_getAll(coll||'signers', callback);
			return module.exports;
		},

		updateUser: function (user, callback) {
			_updateObj(user, 'signers', function (result) {
				// console.log('User updated to %s.', JSON.stringify(result));	
				if (callback) callback(result);
			});
			return module.exports;
		},

		getFromTwtId: function (twtId, callback) {
			_findObj({twitter_id: twtId}, 'signers', callback);
			return module.exports;
		},

	}

}


//         // test = function (err, collection) {
//         //   collection.insert({a:2}, function(err, docs) {

//         //     collection.count(function(err, count) {
//         //       test.assertEquals(1, count);
//         //     });

//         //     // Locate all the entries using find
//         //     collection.find().toArray(function(err, results) {
//         //       test.assertEquals(1, results.length);
//         //       test.assertTrue(results[0].a === 2);
