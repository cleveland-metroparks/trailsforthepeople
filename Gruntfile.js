module.exports = function(grunt) {

  const sass = require('dart-sass');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    local: grunt.file.readJSON('grunt-local-config.json'),

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
          'static/src/js/mobile.js',
          'static/src/js/sidebar.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          'static/src/js/nearby.js',
          'static/src/js/loopsandroutes.js',
          // 'static/src/js/print.js'
        ],
        dest: 'static/dist/js/app.js'
      },
      // Web app package:
      native: {
        src: [
          'static/src/js/constants.js',
          'static/src/js/native-constants.js',
          'static/src/js/common.js',
          'static/src/js/mobile.js',
          'static/src/js/sidebar.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          'static/src/js/nearby.js',
          'static/src/js/loopsandroutes.js',
          // 'static/src/js/print.js'
        ],
        dest: 'static/dist/js/app-native.js'
      },
      // Base for map embeds on external sites:
      embedded_base: {
        src: [
          'static/lib/jquery-1.12.4.min.js',
          'static/lib/turf.js-5.1.6/turf.min.js',
          'static/lib/mapbox-gl-js-1.6.0/mapbox-gl.js',
          'static/src/js/constants.js',
          'static/src/js/embedded-constants.js',
          'static/src/js/common.js'
        ],
        dest: 'static/dist/js/map-embedded-base.js'
      },
      // Base for map embeds on external sites that already have jQuery included (we don't package it):
      embedded_base_nojq: {
        src: [
          'static/lib/turf.js-5.1.6/turf.min.js',
          'static/lib/mapbox-gl-js-1.6.0/mapbox-gl.js',
          'static/src/js/constants.js',
          'static/src/js/embedded-constants.js',
          'static/src/js/common.js'
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
      native: {
        files: {
          'static/dist/js/app-native.min.js': ['static/dist/js/app-native.js']
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
      // For map embed of beach closures:
      embedded_beach_closures: {
        files: {
          'static/dist/js/map-embedded-beach_closures.min.js': ['static/src/js/embedded-beach_closures.js']
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
          'static/src/scss/mobile.scss',
          'static/src/scss/jqm-themes/cm-jqm-theme.css',
          'static/src/scss/tooltips.scss'
        ],
        tasks: ['sass:dist']
      },
      sass_embedded: {
        files: [
          'static/src/scss/embedded.scss'
        ],
        tasks: ['sass:embedded']
      },
      concat_dist: {
        files: [
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/mobile.js',
          'static/src/js/sidebar.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          'static/src/js/nearby.js',
          'static/src/js/loopsandroutes.js',
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
      terser_dist: {
        files: [
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/mobile.js',
          'static/src/js/sidebar.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          'static/src/js/nearby.js',
          'static/src/js/loopsandroutes.js',
          // 'static/src/js/print.js'
        ],
        tasks: ['terser:dist']
      },
      concat_native: {
        files: [
          'static/src/js/constants.js',
          'static/src/js/native-constants.js',
          'static/src/js/common.js',
          'static/src/js/mobile.js',
          'static/src/js/sidebar.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          'static/src/js/nearby.js',
          'static/src/js/loopsandroutes.js',
          // 'static/src/js/print.js'
        ],
        tasks: ['concat:native']
      },
      terser_native: {
        files: [
          'static/src/js/constants.js',
          'static/src/js/native-constants.js',
          'static/src/js/common.js',
          'static/src/js/mobile.js',
          'static/src/js/sidebar.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          'static/src/js/nearby.js',
          'static/src/js/loopsandroutes.js',
          // 'static/src/js/print.js'
        ],
        tasks: ['terser:native']
      },
      concat_embedded_base: {
        files: [
          'static/lib/turf.js-5.1.6/turf.min.js',
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/embedded-constants.js'
        ],
        // tasks: ['concat:embedded_base', 'concat:embedded_base_nojq']
        tasks: ['concat:embedded_base_nojq']
      },
      terser_embedded_base: {
        files: [
          'static/lib/turf.js-5.1.6/turf.min.js',
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/embedded-constants.js',
          'static/dist/js/map-embedded-base.js',
          'static/dist/js/map-embedded-base-nojq.js'
        ],
        // tasks: ['terser:embedded_base', 'terser:embedded_base_nojq']
        tasks: ['terser:embedded_base_nojq']
      },
      terser_embedded_visit: {
        files: [
          'static/src/js/embedded-visit.js'
        ],
        tasks: ['terser:embedded_visit']
      },
      terser_embedded_beach_closures: {
        files: [
          'static/src/js/embedded-beach_closures.js'
        ],
        tasks: ['terser:embedded_beach_closures']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-terser');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');

  // All tasks
  grunt.registerTask('all', ['concat', 'browserify', 'terser', 'sass']);
  // Dist only (non-embedded, non-native)
  grunt.registerTask('dist', ['concat:dist', 'terser:dist', 'sass:dist']);
  // Native tasks only
  grunt.registerTask('native', ['concat:native', 'terser:native', 'sass:dist']);
  // Default: dist and native (non-embedded)
  grunt.registerTask('default', [
    'concat:dist', 'browserify:deps', 'terser:dist', 'sass:dist',
    // 'terser:deps',
    'concat:native', 'terser:native', 'sass:dist'
    ]
  );
  // Embedded tasks only
  grunt.registerTask('embedded', [
    'concat:embedded_base',
    'concat:embedded_base_nojq',

    'terser:embedded_base',
    'terser:embedded_base_nojq',
    'terser:embedded_visit',
    'terser:embedded_beach_closures',

    'sass:embedded'
  ]);
  // Embedded tasks only, without terser
  grunt.registerTask('embedded_nougly', ['concat:embedded_base', 'concat:embedded_base_nojq', 'sass:embedded']);

};
