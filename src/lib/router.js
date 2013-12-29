
/* router.js
** for meavisa.org, by @f03lipe
**
** Route an object with many pages.
**
** Usage:
** routePages({
**     'path': {
**         name: 'name', // Optional, to be used with app.locals.getPageUrl
**         methods: {
**             get: function (req, res) { ... }
**             ...
**         },
**         children: { ... } // same structure, but with relative paths
**     }
** });
*/

module.exports = function Router (app) {

	function routePath (path, name, mToFunc) {
		// TODO: prevent overriding urls with different paths.
		app.locals.urls[name] = path;
		
		// Use app[get/post/put/...] to route methods in mToFunc.
		for (var method in mToFunc)
		if (mToFunc.hasOwnProperty(method)) {
			var func = mToFunc[method];
			// If obj[method] is a list of functions to call, use apply.
			if (func instanceof Array) {
				app[method].apply(app, [path].concat(func));
			} else {
				app[method](path, func);
			}
		}
	}

	var joinPath = require('path').join.bind(require('path'));

	function routeChildren(parentPath, childs) {
		if (!childs) return {};

		for (var relpath in childs)
		if (childs.hasOwnProperty(relpath)) {
			var abspath = joinPath(parentPath, relpath);
			var name = childs[relpath].name || abspath.replace('/','_');
			routePath(abspath, name, childs[relpath].methods);
			routeChildren(abspath, childs[relpath].children);
		}
	}

	return function (object) {

		for (var path in object) if (object.hasOwnProperty(path)) {
			if (object[path].methods)
				routePath(path, object[path].name, object[path].methods);
			routeChildren(path, object[path].children);
		}
	}
}