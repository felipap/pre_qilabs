
requirejs.config({
	baseUrl: "/static/js",
	paths: {
		'app': 			'lib/app',
		'timeline':		'lib/timeline',
		'common': 		'lib/common',
		'plugins': 		'lib/plugins',
		'jquery': 		'vendor/jquery-2.0.3.min',
		'bootstrap': 	'vendor/bootstrap-3.0.0.min',
		'underscore': 	'vendor/underscore-1.5.1.min',
		'backbone': 	'vendor/backbone-1.0.0.min',
		'react': 		'vendor/react-0.9.0',
		'react.backbone':'vendor/react.backbone',
		'showdown': 	'vendor/showdown.min'
	},
	shim: {
		'underscore': { exports: '_' },
		'bootstrap' : { deps: ['jquery'] },
		'backbone'	: { exports: 'Backbone', deps: ['underscore', 'jquery']},
	}
});
