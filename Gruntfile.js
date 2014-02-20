
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
		clean: {
			files: ['min']
		},

		concat: {
			options: {
				banner: "<%= banner %>"
			}, 
			feed: {
				src: [
					'src/static/js/lib/require.js',
					'src/static/js/lib/common.js',
					'src/static/js/lib/plugins.js',
					'src/static/js/lib/feed.js',
				],
				dest: 'src/static/js/concated_feed.js',
			},
			timeline: {
				src: [
					'src/static/js/lib/require.js',
					'src/static/js/lib/common.js',
					'src/static/js/lib/plugins.js',
					'src/static/js/lib/timeline.js',
				],
				dest: 'src/static/js/concated_timeline.js',
			},
			all: {
				src: [
					'src/static/js/lib/require.js',
					'src/static/js/lib/common.js',
					'src/static/js/lib/plugins.js',
				],
				dest: 'src/static/js/concated_all.js',
			}
		},
 
		uglify: {
			options: {
                // sourceMap: '<% filename %>.map',
				banner: '<%= banner %>',
                sourceMap: true,
			},
			feed: {
				src: 'src/static/js/concated_feed.js',
				dest: 'src/static/js/feed.min.js'
			},
			timeline: {
				src: 'src/static/js/concated_timeline.js',
				dest: 'src/static/js/timeline.min.js'
			},
			all: {
				src: 'src/static/js/concated_all.js',
				dest: 'src/static/js/all.min.js'
			}
		},
		
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
        		banner: '<%= banner %>',
			},
			// Beware of the infinite loop
			scripts: {
				files: ['src/static/js/lib/*.js'],
				tasks: ['dist-static-js'],
				options: { spawn: false },
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
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-coffee');
	grunt.loadNpmTasks('grunt-concurrent');
	grunt.loadNpmTasks('grunt-nodemon');	

	grunt.registerTask('dist-coffee', ['coffee']);
	grunt.registerTask('dist-static-js', ['concat', 'uglify']);

	// 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
	grunt.registerTask('serve', ['nodemon']);
};
