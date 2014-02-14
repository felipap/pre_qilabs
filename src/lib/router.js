
/* router.js
** for qilabs.org, by @f03lipe
**
** Route an object with many pages.
**
** Usage:
** routePages({
**    'path': {
**        name: 'name', // Optional, to be used with app.locals.getPageUrl
**        permissions: [required.login,] // Decorators to attach to all children
**        methods: {
**            get: function (req, res) { ... }
**            ...
**        },
**        children: { ... } // same structure, but with relative paths
**    }
** });
*/

module.exports = function Router (app) {

	var joinPath = require('path').join.bind(require('path'));

	function routePath (path, name, mToFunc, permissions) {
		// TODO: prevent overriding urls with different paths.
		app.locals.urls[name] = path;
		
		// Use app[get/post/put/...] to route methods in mToFunc.
		for (var method in mToFunc)
		if (mToFunc.hasOwnProperty(method)) {
			var func = mToFunc[method];
			// Call app[method] with arguments (path, *permissions)
			app[method].apply(app, [path].concat(permissions||[]).concat(func));
		}
	}

	function routeChildren(parentPath, childs, permissions) {
		if (!childs) return {};
		// Type-check just to make sure.
		permissions = permissions || [];
		console.assert(permissions instanceof Array);

		for (var relpath in childs)
		if (childs.hasOwnProperty(relpath)) {
			// Join with parent's path to get abspath.
			var abspath = joinPath(parentPath, relpath);
			// Name is self-assigned or path with dashed instead of slashes.
			var name = childs[relpath].name || abspath.replace('/','_');
			// Permissions are parent's + child's ones 
			var newPermissions = permissions.concat(childs[relpath].permissions || []);
			routePath(abspath, name, childs[relpath].methods, newPermissions);
			routeChildren(abspath, childs[relpath].children, newPermissions);
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