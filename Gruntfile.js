module.exports = function(grunt) {

  const sass = require('dart-sass');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // local: grunt.file.readJSON('grunt-local-config.json'),

    /**
     *
     * Concatenate
     *
     */
    concat: {
      options: {
        separator: '\n;\n', // First newline for files that end in a comment line
      },
      // Web app package:
      dist: {
        src: [
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/data.js',
          'static/src/js/mobile.js',
          'static/src/js/sidebar.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          // 'static/src/js/nearby.js',
          'static/src/js/trails.js',
          'static/dist/js/handlebars-templates.js',
          // 'static/src/js/print.js'
        ],
        dest: 'static/dist/js/app.js'
      },
      // Base for map embeds on external sites:
      embedded_base: {
        src: [
          'static/lib/jquery-1.12.4.min.js',
          'static/dist/js/deps-embedded.js',
          'static/src/js/constants.js',
          'static/src/js/embedded-constants.js',
          'static/src/js/common.js',
          'static/src/js/data.js'
        ],
        dest: 'static/dist/js/map-embedded-base.js'
      },
      // Base for map embeds on external sites that already have jQuery included (we don't package it):
      embedded_base_nojq: {
        src: [
          'static/dist/js/deps-embedded.js',
          'static/src/js/constants.js',
          'static/src/js/embedded-constants.js',
          'static/src/js/common.js',
          'static/src/js/data.js'
        ],
        dest: 'static/dist/js/map-embedded-base-nojq.js'
      }
    },

    /**
     *
     * Browserify
     *
     */
    browserify: {
      deps: {
        src: 'static/src/js/deps-app.js',
        dest: 'static/dist/js/deps-app.js'
      },
      deps_embedded: {
        src: 'static/src/js/deps-embedded.js',
        dest: 'static/dist/js/deps-embedded.js'
      }
    },

    /**
     *
     * Handlebars
     *
     */
    handlebars: {
      all: {
        options: {
          namespace: 'CM.Templates',
          processName: function(filePath) {
            // Strip the path to leave the filename
            var pieces = filePath.split('/');
            var filename = pieces[pieces.length - 1];
            // Remove the file extension
            pieces = filename.split('.');
            var name = pieces[0];
            return name;
          }
        },
        files: {
          'static/dist/js/handlebars-templates.js': 'static/src/js/templates/*.hbs',
        }
      }
    },

    /**
     *
     * Minify
     *
     */
    terser: {
      // Web app package:
      dist: {
        files: {
          'static/dist/js/mobile.min.js':    ['static/src/js/mobile.js'],
          'static/dist/js/constants.min.js': ['static/src/js/constants.js'],
          'static/dist/js/common.min.js':    ['static/src/js/common.js'],
          'static/dist/js/app.min.js':       ['static/dist/js/app.js']
        }
      },
      deps: {
        files: {
          'static/dist/js/deps-app.min.js':  ['static/dist/js/deps-app.js']
        }
      },
      // Base for map embeds on external sites:
      embedded_base: {
        files: {
          'static/dist/js/map-embedded-base.min.js': ['static/dist/js/map-embedded-base.js']
        }
      },
      // Base for map embeds on external sites that already have jQuery included (we don't package it):
      embedded_base_nojq: {
        files: {
          'static/dist/js/map-embedded-base-nojq.min.js': ['static/dist/js/map-embedded-base-nojq.js']
        }
      },
      // For map embed on Visit page:
      embedded_visit: {
        files: {
          'static/dist/js/map-embedded-visit.min.js': ['static/src/js/embedded-visit.js']
        }
      },
      // For map embed on Planning & Design (Capital Projects) page:
      embedded_pnd: {
        files: {
          'static/dist/js/map-embedded-pnd.min.js': ['static/src/js/embedded-pnd.js']
        }
      }
    },

    /**
     *
     * SASS
     *
     */
    sass: {
      options: {
        implementation: sass
      },
      // Web app package:
      dist: {
        options: {
          outputStyle: 'compressed'
        },
        files: {
          'static/dist/css/mobile.css': 'static/src/scss/mobile.scss'
        }
      },
      // For map embeds on external sites:
      embedded: {
        options: {
          outputStyle: 'compressed'
        },
        files: {
          'static/dist/css/embedded.css': 'static/src/scss/embedded.scss'
        }
      }
    },

    /**
     *
     * Watch
     *
     */
    watch: {
      config_files: {
        files: [
          'Gruntfile.js'
        ],
        options: {
          reload: true
        }
      },
      sass_dist: {
        files: [
          'static/src/scss/_variables.scss',
          'static/src/scss/sidebar.scss',
          'static/src/scss/map.scss',
          'static/src/scss/fonts.scss',
          'static/src/scss/jqm-themes/cm-jqm-theme.css',
          'static/src/scss/tooltips.scss',
          'static/src/scss/mobile.scss'
        ],
        tasks: ['sass:dist']
      },
      //sass_embedded: {
      //  files: [
      //    'static/src/scss/embedded.scss'
      //  ],
      //  tasks: ['sass:embedded']
      //},
      concat_dist: {
        files: [
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/data.js',
          'static/src/js/mobile.js',
          'static/src/js/sidebar.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          // 'static/src/js/nearby.js',
          'static/src/js/trails.js',
          'static/dist/js/handlebars-templates.js',
          // 'static/src/js/print.js'
        ],
        tasks: ['concat:dist']
      },
      browserify_deps: {
        files: [
          'static/src/js/deps-app.js'
        ],
        tasks: ['browserify:deps']
      },
      browserify_deps_embedded: {
        files: [
          'static/src/js/deps-embedded.js'
        ],
        tasks: ['browserify:deps_embedded']
      },
      handlebars_all: {
        files: [
          'static/src/js/templates/*.hbs'
        ],
        tasks: ['handlebars:all']
      },
      terser_dist: {
        files: [
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/data.js',
          'static/src/js/mobile.js',
          'static/src/js/sidebar.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          // 'static/src/js/nearby.js',
          'static/src/js/trails.js',
          'static/dist/js/handlebars-templates.js',
          // 'static/src/js/print.js'
        ],
        tasks: ['terser:dist']
      },
      //concat_embedded_base: {
      //  files: [
      //    'static/lib/turf.js-5.1.6/turf.min.js',
      //    'static/src/js/constants.js',
      //    'static/src/js/common.js',
      //    'static/src/js/data.js',
      //    'static/src/js/embedded-constants.js'
      //  ],
      //  // tasks: ['concat:embedded_base', 'concat:embedded_base_nojq']
      //  tasks: ['concat:embedded_base_nojq']
      //},
      //terser_embedded_base: {
      //  files: [
      //    'static/lib/turf.js-5.1.6/turf.min.js',
      //    'static/src/js/constants.js',
      //    'static/src/js/common.js',
      //    'static/src/js/data.js',
      //    'static/src/js/embedded-constants.js',
      //    'static/dist/js/map-embedded-base.js',
      //    'static/dist/js/map-embedded-base-nojq.js'
      //  ],
      //  // tasks: ['terser:embedded_base', 'terser:embedded_base_nojq']
      //  tasks: ['terser:embedded_base_nojq']
      //},
      //terser_embedded_visit: {
      //  files: [
      //    'static/src/js/embedded-visit.js'
      //  ],
      //  tasks: ['terser:embedded_visit']
      //},
      //terser_embedded_pnd: {
      //  files: [
      //    'static/src/js/embedded-pnd.js'
      //  ],
      //  tasks: ['terser:embedded_pnd']
      //}
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-terser');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');

  // All tasks
  grunt.registerTask('all', ['handlebars', 'concat', 'browserify', 'terser', 'sass']);
  // Default: dist (non-embedded)
  grunt.registerTask('default', ['handlebars:all', 'concat:dist', 'browserify:deps', 'terser:dist', 'sass:dist']);
  // Embedded tasks only
  grunt.registerTask('embedded', [
    'browserify:deps_embedded',

    'concat:embedded_base',
    'concat:embedded_base_nojq',

    'terser:embedded_base',
    'terser:embedded_base_nojq',
    'terser:embedded_visit',
    'terser:embedded_pnd',

    'sass:embedded'
  ]);
  // Embedded tasks only, without terser
  grunt.registerTask('embedded_nougly', [
    'browserify:deps_embedded',

    'concat:embedded_base',
    'concat:embedded_base_nojq',

    'sass:embedded'
  ]);

};
