/*
# models/tag.coffee
# for meavisa.org, by @f03lipe
#
# Tag model.
*/

var TagSchema, api, authTypes, blog, blog_url, checkFollowed, crypto, descTable, findOrCreate, getDescription, getLabel, memjs, mongoose, recursify, transTable, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

crypto = require('crypto');

memjs = require('memjs');

_ = require('underscore');

findOrCreate = require('./lib/findOrCreate');

api = require('./../api');

authTypes = [];

TagSchema = new mongoose.Schema({
  name: {
    type: String
  },
  children: {
    type: Array
  },
  description: {
    type: String
  }
});

TagSchema.methods = {};

String.prototype.toCamel = function(){
	return this.replace(/([a-z]+)/g, function(a){return a[0].toUpperCase()+a.slice(1);});
};;

transTable = {
  'estagio': 'Estágio',
  'olimpiadas': 'Olimpíadas',
  'voluntariado': 'Voluntariado',
  'bolsasdeestudo': 'Bolsas de Estudo',
  'matematica': 'Matemática',
  'cursos': 'Cursos',
  'intercambio': 'Intercâmbio'
};

descTable = {
  'olimpiadas:matematica': 'Novidades sobre a <a href="#">OBM</a>, <a href="#">OBMEP</a>, olimpíadas de matemática estaduais e cursos relacionados à elas.',
  'intercambio': 'Já pensou em estudar no exterior? É possível! Siga a tag para saber sobre bolsas de estudo, palestras e outros eventos relacionados a intercâmbio.',
  'mun': 'O Modelo das Nações unidas (Model United Nations) é um modelo de organizações internacionais realizado por estudantes para simular o funcionamento da ONU e, assim, desenvolverem suas habilidades de falar em público.'
};

/*
# Turn a horizontal list of tags into a recursive structure with label and children.
# TODO! this implementation looks expensive
# TODO! Rename this to buildTag, or smthing.
*/


recursify = function(tags) {
  var chashtag, hashtag, parent, tagList, tagsObj, _base, _i, _len;
  tagsObj = {
    hashtag: '',
    label: null,
    children: {}
  };
  for (_i = 0, _len = tags.length; _i < _len; _i++) {
    hashtag = tags[_i];
    tagList = hashtag.split(':');
    parent = tagsObj;
    while (tagList.length) {
      hashtag = tagList.shift();
      chashtag = parent.hashtag + (!parent.hashtag ? '' : ':') + hashtag;
      parent = (_base = parent.children)[hashtag] != null ? (_base = parent.children)[hashtag] : _base[hashtag] = {
        hashtag: chashtag,
        label: getLabel(hashtag),
        description: getDescription(chashtag),
        children: {}
      };
    }
  }
  return tagsObj.children;
};

/*
# Takes as input
@param rtags 	{Array} 	A recursive tags object
@param followed {Array} 	A plain list of tags the user follows.
@return rtags 	{Object}	Recursive tags object with attrs checked in each tag
*/


checkFollowed = function(rtags, followed) {
  var check;
  _.each(rtags, check = function(e, i) {
    var _ref;
    _.each(e.children, check);
    return e.checked = (_ref = e.hashtag, __indexOf.call(followed, _ref) >= 0) ? true : false;
  });
  return rtags;
};

getDescription = function(hashtag) {
  return descTable[hashtag.toLowerCase()] || '';
};

getLabel = function(hashtag) {
  return transTable[hashtag.toLowerCase()] || hashtag.toCamel();
};

blog_url = 'http://meavisa.tumblr.com';

blog = api.getBlog('meavisa.tumblr.com');

TagSchema.statics.getAll = function(cb) {
  var _this = this;
  return this.getCached(function(err, results) {
    if (err || !results.length) {
      return api.pushBlogTags(blog, function(err, _tags) {
        var tags;
        if (err) {
          cb(err);
        }
        tags = _this.recursify(_tags);
        return cb(null, tags);
      });
    } else {
      return cb(null, results);
    }
  });
};

TagSchema.statics.getCached = function(cb) {
  var mc;
  mc = memjs.Client.create();
  return mc.get('tags', function(err, val, key) {
    var ret;
    if (err) {
      console.warn('Cache error:', err);
      ret = [];
    } else if (val === null) {
      console.warn('Cache query for tags returned null.');
      ret = [];
    } else {
      ret = JSON.parse(val.toString());
    }
    return cb(null, ret);
  });
};

TagSchema.statics.fetchAndCache = function(cb) {
  var mc,
    _this = this;
  mc = memjs.Client.create();
  console.log('Flushing cached tags.');
  return api.pushBlogTags(blog, function(err, tags) {
    if (err) {
      throw err;
    }
    return mc.set('tags', JSON.stringify(_this.recursify(tags)), cb);
  });
};

TagSchema.statics.findOrCreate = findOrCreate;

TagSchema.statics.getLabel = getLabel;

TagSchema.statics.getDescription = getDescription;

TagSchema.statics.recursify = recursify;

TagSchema.statics.checkFollowed = checkFollowed;

module.exports = mongoose.model("Tag", TagSchema);
