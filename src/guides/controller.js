var MD_LOCATION, async, converter, fs, guideData, guideMap, id, pages, path, q, routeChildren, showdown, val, _;

_ = require('underscore');

async = require('async');

showdown = require('showdown');

fs = require('fs');

path = require('path');

MD_LOCATION = 'text';

guideMap = require('./text/map.js');

guideData = {};

routeChildren = function(children, parentPath) {
  var routes, tagId, value, _fn;
  routes = {};
  _fn = function(tagId, value) {
    return routes['/' + tagId] = {
      name: 'guide_' + (parentPath + tagId).replace('/', '_'),
      get: function(req, res) {
        console.log(guideData[parentPath + tagId]);
        return res.render('pages/guide_pages/page', {
          guideData: guideData,
          tagData: guideData[parentPath + tagId]
        });
      },
      children: (value.children && routeChildren(value.children, parentPath + tagId + '/')) || {}
    };
  };
  for (tagId in children) {
    value = children[tagId];
    _fn(tagId, value);
  }
  return routes;
};

pages = {
  '/': {
    name: 'guide_home',
    get: function(req, res) {
      return res.render('guide', {});
    }
  },
  children: routeChildren(guideMap, '/')
};

console.log('pages:', pages);

converter = new showdown.converter();

q = async.queue((function(item, cb) {
  var absPath, citem, cval, _ref;
  console.log("<queue> processing item: " + item);
  _ref = item.children;
  for (citem in _ref) {
    cval = _ref[citem];
    q.push(_.extend({
      id: citem,
      parent: (item.parent || '/') + item.id + '/'
    }, cval));
  }
  absPath = path.resolve(__dirname, MD_LOCATION, item.file);
  return fs.readFile(absPath, 'utf8', function(err, text) {
    if (!text) {
      throw "WTF, file " + item.id + " of path " + absPath + " wasn't found";
    }
    guideData[(item.parent || '/') + item.id] = _.extend({
      md: text,
      html: converter.makeHtml(text),
      path: '/guias' + (item.parent || '/') + item.id,
      rootId: item.rootId || item.id
    }, item);
    return cb();
  });
}), 3);

q.drain = function() {
  return console.log('guideData', guideData);
};

for (id in guideMap) {
  val = guideMap[id];
  q.push(_.extend({
    id: id,
    parent: '/',
    rootId: null
  }, val));
}

module.exports = pages;
