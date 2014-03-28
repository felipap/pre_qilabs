
requirejs.config({
	dir: 	'../build-js',
	baseUrl:'/static/js', // Override this inside grunt. Must be '.' for r.js.

	paths: {
		'common':			'app/common',
		'plugins':			'app/plugins',
		// App
		'views.common':		'app/views/common',
		'views.timeline':	'app/views/timeline',
		'views.cards':		'app/views/cards',
		'views.profile':	'app/views/profile',
		'views.lab':		'app/views/lab',
		'views.panel':		'app/views/panel',
		// 'app.guide':		'app/app/guide',
		// 'app.mural':		'app/app/mural',
		// Components
		'components.bell':		'app/components/bell',
		'components.cards':		'app/components/cards',
		'components.timeline':	'app/components/timeline',
		'components.postForms':	'app/components/postForms',
		'components.postModels':'app/components/postModels',
		'components.postViews':	'app/components/postViews',
		// Third-party
		'jquery':			'vendor/jquery-2.0.3.min',
		'bootstrap':		'vendor/bootstrap-3.0.0.min',
		'underscore':		'vendor/underscore-1.5.1.min',
		'backbone':			'vendor/backbone-1.0.0.min',
		'react':			'vendor/react-0.9.0',
		'react.backbone':	'vendor/react.backbone',
		'showdown':			'vendor/showdown.min',
		'bootstrap.tooltip':'vendor/bootstrap/tooltip',
		'bootstrap.dropdown':'vendor/bootstrap/dropdown',
		'bootstrap.popover':'vendor/bootstrap/popover',
	},
	shim: {
		'bootstrap.tooltip': { deps: ['jquery'] },
		'bootstrap.dropdown': { deps: ['jquery'] },
		'bootstrap.popover': { deps: ['jquery', 'bootstrap.tooltip'] },
		'underscore': { exports: '_' },
		'bootstrap' : { deps: ['jquery'] },
		'backbone'	: { exports: 'Backbone', deps: ['underscore', 'jquery']},
	}
});
