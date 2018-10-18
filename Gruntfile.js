module.exports = function(grunt) {

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
        separator: ';\n',
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
          'static/src/js/print.js'
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
          'static/src/js/print.js'
        ],
        dest: 'static/dist/js/app-native.js'
      },
      // Base for map embeds on external sites:
      embedded_base: {
        src: [
          'static/lib/jquery-1.12.4.min.js',
          'static/lib/leaflet-1.0.3/leaflet.js',
          'static/lib/mapbox.js-2.4.0/mapbox.standalone.js',
          'static/lib/mapbox-gl-js-0.35.1/mapbox-gl.js',
          'static/lib/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
          'static/src/js/constants.js',
          'static/src/js/embedded-constants.js',
          'static/src/js/common.js'
        ],
        dest: 'static/dist/js/map-embedded-base.js'
      },
      // Base for map embeds on external sites that already have jQuery included (we don't package it):
      embedded_base_nojq: {
        src: [
          'static/lib/leaflet-1.0.3/leaflet.js',
          'static/lib/mapbox.js-2.4.0/mapbox.standalone.js',
          'static/lib/mapbox-gl-js-0.35.1/mapbox-gl.js',
          'static/lib/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
          'static/src/js/constants.js',
          'static/src/js/embedded-constants.js',
          'static/src/js/common.js'
        ],
        dest: 'static/dist/js/map-embedded-base-nojq.js'
      },
      // DEPRECATED: Map embeds on external sites:
      embedded_visit_DEPRECATED: {
        src: [
          'static/lib/jquery-1.12.4.min.js',
          'static/lib/leaflet-1.0.3/leaflet.js',
          'static/lib/mapbox.js-2.4.0/mapbox.standalone.js',
          'static/lib/mapbox-gl-js-0.35.1/mapbox-gl.js',
          'static/lib/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
          'static/src/js/constants.js',
          'static/src/js/embedded-constants.js',
          'static/src/js/common.js',
          'static/src/js/embedded.js'
        ],
        dest: 'static/dist/js/map-embedded.js'
      },
      // DEPRECATED: Map embeds on external sites that already have jQuery included (we don't package it):
      embedded_visit_nojq_DEPRECATED: {
        src: [
          'static/lib/leaflet-1.0.3/leaflet.js',
          'static/lib/mapbox.js-2.4.0/mapbox.standalone.js',
          'static/lib/mapbox-gl-js-0.35.1/mapbox-gl.js',
          'static/lib/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
          'static/src/js/constants.js',
          'static/src/js/embedded-constants.js',
          'static/src/js/common.js',
          'static/src/js/embedded.js'
        ],
        dest: 'static/dist/js/map-embedded-nojq.js'
      }
    },

    /**
     *
     * Minify
     *
     */
    uglify: {
      // Web app package:
      dist: {
        files: {
          'static/dist/js/mobile.min.js':    ['static/src/js/mobile.js'],
          'static/dist/js/constants.min.js': ['static/src/js/constants.js'],
          'static/dist/js/common.min.js':    ['static/src/js/common.js'],
          'static/dist/js/app.min.js':       ['static/dist/js/app.js']
        }
      },
      native: {
        files: {
          'static/dist/js/app-native.min.js':       ['static/dist/js/app-native.js']
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
      // For map embed on Visit page (DEPRECATED):
      embedded_visit_DEPRECATED: {
        files: {
          'static/dist/js/map-embedded.min.js': ['static/dist/js/map-embedded.js']
        }
      },
      // For map embed on Visit page (DEPRECATED):
      embedded_visit_nojq_DEPRECATED: {
        files: {
          'static/dist/js/map-embedded-nojq.min.js': ['static/dist/js/map-embedded-nojq.js']
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
      // Web app package:
      dist: {
        options: {
          style: 'compact'
        },
        files: {
          'static/dist/css/mobile.css': 'static/src/scss/mobile.scss',
          'static/src/scss/jqm-themes/cm-jqm-theme.min.css': 'static/src/scss/jqm-themes/cm-jqm-theme.css'
        }
      },
      // For map embeds on external sites:
      embedded: {
        options: {
          style: 'compact'
        },
        files: {
          'static/dist/css/embedded.css': 'static/src/scss/embedded.scss'
        }
      }
    },

    /**
     *
     * SFTP
     *
     */
    sftp: {
      options: {
        path: '<%= local.remoteHost.path %>',
        host: '<%= local.remoteHost.hostname %>',
        port: '<%= local.remoteHost.port %>',
        username: '<%= local.remoteHost.username %>',
        password: '<%= local.remoteHost.password %>',
        showProgress: true,
        readyTimeout: '<%= local.remoteHost.readyTimeout %>'
      },
      // Web app package:
      dist: {
        files: {
          "./": [
            "static/dist/css/mobile.css",
            "static/src/scss/jqm-themes/cm-jqm-theme.min.css",
            "static/dist/js/mobile.min.js",
            "static/dist/js/constants.min.js",
            "static/dist/js/common.min.js",
            "static/dist/js/app.min.js"
          ]
        }
      },
      // For map embeds on external sites:
      embedded: {
        files: {
          "./": [
            // DEPRECATED Visit page
            "static/dist/js/map-embedded.js",
            "static/dist/js/map-embedded.min.js",
            "static/dist/js/map-embedded-nojq.js",
            "static/dist/js/map-embedded-nojq.min.js",
            // Embedded base
            "static/dist/js/map-embedded-base.js",
            "static/dist/js/map-embedded-base.min.js",
            "static/dist/js/map-embedded-base-nojq.js",
            "static/dist/js/map-embedded-base-nojq.min.js",
            // Visit page
            "static/dist/js/map-embedded-visit.js",
            "static/dist/js/map-embedded-visit.min.js",
            // Beach closures
            "static/dist/js/map-embedded-beach_closures.js",
            "static/dist/js/map-embedded-beach_closures.min.js"
          ]
        }
      }
    },

    /**
     *
     * Watch
     *
     */
    watch: {
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
          'static/src/js/print.js'
        ],
        tasks: ['concat:dist']
      },
      uglify_dist: {
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
          'static/src/js/print.js'
        ],
        tasks: ['uglify:dist']
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
          'static/src/js/print.js'
        ],
        tasks: ['concat:native']
      },
      uglify_native: {
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
          'static/src/js/print.js'
        ],
        tasks: ['uglify:native']
      }
      //concat_embedded: {
      //  files: [
      //    'static/src/js/constants.js',
      //    'static/src/js/common.js',
      //    'static/src/js/embedded.js',
      //    'static/src/js/embedded-constants.js'
      //  ],
      //  tasks: ['concat:embedded_base', 'concat:embedded_base_nojq']
      //},
      //uglify_embedded: {
      //  files: [
      //    'static/dist/js/map-embedded.js',
      //    'static/dist/js/map-embedded-nojq.js'
      //  ],
      //  tasks: ['uglify:embedded', 'uglify:embedded_nojq']
      //}
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // All tasks
  grunt.registerTask('all', ['concat', 'uglify', 'sass']);
  // Dist only (non-embedded, non-native)
  grunt.registerTask('dist', ['concat:dist', 'uglify:dist', 'sass:dist']);
  // Native tasks only
  grunt.registerTask('native', ['concat:native', 'uglify:native', 'sass:dist']);
  // Default: dist and native (non-embedded)
  grunt.registerTask('default', [
    'concat:dist', 'uglify:dist', 'sass:dist',
    'concat:native', 'uglify:native', 'sass:dist'
    ]
  );
  // Embedded tasks only
  grunt.registerTask('embedded', [
    'concat:embedded_base',
    'concat:embedded_base_nojq',
    'concat:embedded_visit_DEPRECATED',
    'concat:embedded_visit_nojq_DEPRECATED',
    'uglify:embedded_base',
    'uglify:embedded_base_nojq',
    'uglify:embedded_visit_DEPRECATED',
    'uglify:embedded_visit_nojq_DEPRECATED',
    'uglify:embedded_visit',
    'uglify:embedded_beach_closures',
    'sass:embedded'
  ]);
  // Embedded tasks only, without uglify
  grunt.registerTask('embedded_nougly', ['concat:embedded_base', 'concat:embedded_base_nojq', 'sass:embedded']);

};
