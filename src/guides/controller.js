var async, converter, fs, id, map, pages, path, q, renderGuide, routeChildren, showdown, tagData, val, _;

_ = require('underscore');

async = require('async');

showdown = require('showdown');

fs = require('fs');

path = require('path');

map = require('./map.js');

tagData = {};

renderGuide = function(req, res, tagPath) {
  console.log(tagPath, tagData[tagPath]);
  return res.render('pages/guide_pages/page', {
    tagData: tagData[tagPath]
  });
};

routeChildren = function(children, parentPath) {
  var routes, tagId, value, _fn;
  routes = {};
  _fn = function(tagId, value) {
    return routes['/' + tagId] = {
      name: 'guide_' + tagId,
      get: function(req, res) {
        return renderGuide(req, res, parentPath + tagId);
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
  children: routeChildren(map, '/')
};

console.log('there!', pages);

converter = new showdown.converter();

q = async.queue((function(item, cb) {
  var absPath, citem, cval, _ref;
  console.log("Queue: processing item:", item);
  _ref = item.children;
  for (citem in _ref) {
    cval = _ref[citem];
    q.push(_.extend({
      id: citem
    }, cval, {
      parent: (item.parent || '/') + item.id + '/'
    }));
  }
  absPath = path.resolve(__dirname, item.file);
  return fs.readFile(absPath, 'utf8', function(err, text) {
    if (!text) {
      throw "WTF, file " + absPath + " wasn't found";
    }
    tagData[(item.parent || '/') + item.id] = _.extend({}, item, {
      md: text,
      html: converter.makeHtml(text)
    });
    return cb();
  });
}), 3);

q.drain = function() {
  return console.log('tagData', tagData);
};

for (id in map) {
  val = map[id];
  q.push(_.extend({
    id: id,
    parent: '/'
  }, val));
}

module.exports = pages;
