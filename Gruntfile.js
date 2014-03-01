
module.exports = function(grunt) {
	'use strict';

	// 1. All configuration goes here 
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		version: grunt.file.readJSON('package.json').version,
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= version %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= pkg.license %> */\n',
		
		less: {
			dist: {
				files: { // change to singular?
					'src/static/css/sn_pages.min.css':'src/static/less/views/sn_pages.less',
					'src/static/css/full_bg_page.min.css':'src/static/less/views/full_bg_page.less',
					'src/static/css/about_pages.min.css':'src/static/less/views/about_pages.less',
				},
				options: { cleancss: true },
			},
		},
		
		coffee: {
			options: {
				bare: true,
			},
			glob_to_multiple: {
				expand: true,
				src: ['src/**/*.coffee','tasks/**/*.coffee'],
				ext: '.js',
			}
		},

		// Higher-lever configuration
		watch: {
			options: {
				// livereload: true,
				atBegin: true,
			},
			// Beware of the infinite loop
			scripts_common: {
				files: ['src/static/js/lib/common.js','src/static/js/lib/plugins.js','src/static/js/lib/timeline.js'],
				tasks: ['requirejs'],
			},
			scripts_app: {
				files: ['src/static/js/lib/app.js'],
				tasks: ['requirejs'],
			},
			css: {
				files: ['src/static/less/**/*.less'],
				tasks: ['less'],
				options: { spawn: false },				
			},
			coffee: {
				files: ['**/*.coffee'],
				tasks: ['dist-coffee'],
				options: { spawn: false },
			},
		},

		nodemon: {
			dev: {
				script: 'src/app.js',
				options: {
					args: ['dev'],
					nodeArgs: ['--debug'],
					// watch: ['src'],
					ignore: ['node_modules/**','src/static/**'],
					ext: 'js',
					delayTime: 1,

					legacyWatch: true,
					cwd: __dirname,
				}
			},
		},

		requirejs: {
			app: {
				options: {
					logLevel: 2,
					name: 'app',
					baseUrl: 'src/static/js/',
					mainConfigFile: 'src/static/js/build.js',
					out: 'src/static/js/app.min.js',
					generateSourceMaps: true,
					optimize: 'none',
					preserveLicenseComments: false,
				}
			},
			common: {
				options: {
					logLevel: 2,
					name: 'common',
					baseUrl: 'src/static/js/',
					mainConfigFile: 'src/static/js/build.js',
					out: 'src/static/js/common.min.js',
					generateSourceMaps: true,
					optimize: 'none',
					preserveLicenseComments: false,
				}
			}
		},

		concurrent: {
			dev: {
				tasks: ['nodemon', 'watch'], // +? 'node-inspector'
				options: {
					logConcurrentOutput: true
				}
			}
		},
	});

	// 3. Where we tell Grunt we plan to use this plug-in.
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-coffee');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-nodemon');	

	grunt.registerTask('dist-coffee', ['coffee']);

	// 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
	grunt.registerTask('serve', ['nodemon']);
};
