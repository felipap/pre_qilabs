
module.exports = function(grunt) {
	'use strict';

	// 1. All configuration goes here 
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		version: grunt.file.readJSON('package.json').version,
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= version %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
			' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
		clean: {
			files: ['min']
		},

		concat: {
			home: {
				src: [
					'src/static/js/lib/require.js',
					'src/static/js/lib/common.js',
					'src/static/js/lib/plugins.js',
					'src/static/js/lib/home.js',
				],
				dest: 'src/static/js/concated_home.js',
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
			home: {
				src: 'src/static/js/concated_home.js',
				dest: 'src/static/js/home.min.js'
			},
			all: {
				src: 'src/static/js/concated_all.js',
				dest: 'src/static/js/all.min.js'
			}
		},
		
		less: {
			pages: {
				files: { 'src/static/css/pages.min.css':'src/static/less/views/pages.less' },
				options: { cleancss: true },
			},
			home: {
				files: { 'src/static/css/home.min.css':'src/static/less/views/home.less' },
				options: { cleancss: true },
			},
			frontpage: {
				files: { 'src/static/css/frontpage.min.css':'src/static/less/views/frontpage.less' },
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
		// htmlmin: {
		// 	dist: {
		// 		options: {
		// 			removeComments: true,
		// 			collapseWhitespace: true
		// 		},
		// 		files: {
		// 			'dist/index.html': 'src/index.html',
		// 			'dist/contact.html': 'src/contact.html'
		// 		}
		// 	},
		// },

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
			// html: {
			// 	files: {
			// 		'src/views/dist/*.html': 'src/views/pages/*.html',
			// 	},
			// 	tasks: ['htmlmin']
			// }
		},

		nodemon: {
			dev: {
				options: {
					file: 'src/app.js',
					args: ['dev'],
					nodeArgs: ['--debug'],
					ignoredFiles: ['node_modules/**','src/static/**'],
					// watchedExtensions: ['js','css'],
					watchedFolders: ['src'],
					delayTime: 1,
					legacyWatch: true,
					cwd: __dirname
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
	grunt.loadNpmTasks('grunt-contrib-htmlmin');

	grunt.registerTask('dist-coffee', ['coffee']);
	grunt.registerTask('dist-static-js', ['concat', 'uglify']);

	// 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
	// grunt.registerTask('watch', ['watch']);
	grunt.registerTask('default', ['nodemon']);
};
