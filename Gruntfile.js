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
      // Main package:
      dist: {
        src: [
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/mobile.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          'static/src/js/nearby.js',
          'static/src/js/trails.js',
          'static/src/js/loopsandroutes.js',
          'static/src/js/print.js'
        ],
        dest: 'static/dist/js/app.js'
      },
      // Map embeds on external sites:
      embedded: {
        src: [
          'static/lib/jquery-1.12.4.min.js',
          'static/lib/purl.js',
          'static/lib/leaflet-1.0.3/leaflet.js',
          'static/lib/mapbox.js-2.4.0/mapbox.standalone.js',
          'static/lib/mapbox-gl-js-0.28.0/mapbox-gl.js',
          'static/lib/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
          'static/lib/cookie.js',
          'static/src/js/constants.js',
          'static/src/js/embedded-constants.js',
          'static/src/js/common.js',
          'static/src/js/embedded.js'
        ],
        dest: 'static/dist/js/map-embedded.js'
      },
      // Map embeds on external sites that already have jQuery included (we don't package it):
      embedded_nojq: {
        src: [
          'static/lib/purl.js',
          'static/lib/leaflet-1.0.3/leaflet.js',
          'static/lib/mapbox.js-2.4.0/mapbox.standalone.js',
          'static/lib/mapbox-gl-js-0.28.0/mapbox-gl.js',
          'static/lib/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
          'static/lib/cookie.js',
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
      // Main package:
      dist: {
        files: {
          'static/dist/js/mobile.min.js':    ['static/src/js/mobile.js'],
          'static/dist/js/constants.min.js': ['static/src/js/constants.js'],
          'static/dist/js/common.min.js':    ['static/src/js/common.js'],
          'static/dist/js/app.min.js':       ['static/dist/js/app.js']
        }
      },
      // For map embeds on external sites:
      embedded: {
        files: {
          'static/dist/js/map-embedded.min.js': ['static/dist/js/map-embedded.js']
        }
      },
      // Map embeds on external sites that already have jQuery included (we don't package it):
      embedded_nojq: {
        files: {
          'static/dist/js/map-embedded-nojq.min.js': ['static/dist/js/map-embedded-nojq.js']
        }
      }
    },

    /**
     *
     * SASS
     *
     */
    sass: {
      // Main package:
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
      // Main package:
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
            "static/dist/js/map-embedded.js",
            "static/dist/js/map-embedded.min.js",
            "static/dist/js/map-embedded-nojq.js",
            "static/dist/js/map-embedded-nojq.min.js",
            "static/dist/css/embedded.css"
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
          'static/src/scss/mobile.scss',
          'static/src/scss/jqm-themes/cm-jqm-theme.css'
        ],
        tasks: ['sass:dist']
      },
      sass_embedded: {
        files: [
          'static/src/scss/embedded.scss'
        ],
        tasks: ['sass:embedded']
      },
      uglify_dist: {
        files: [
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/mobile.js',
          'static/src/js/geolocate.js',
          'static/src/js/directions.js',
          'static/src/js/share.js',
          'static/src/js/search.js',
          'static/src/js/nearby.js',
          'static/src/js/trails.js',
          'static/src/js/loopsandroutes.js',
          'static/src/js/print.js'
        ],
        tasks: ['uglify:dist']
      },
      concat_embedded: {
        files: [
          'static/src/js/constants.js',
          'static/src/js/common.js',
          'static/src/js/embedded.js',
          'static/src/js/embedded-constants.js'
        ],
        tasks: ['concat:embedded', 'concat:embedded_nojq']
      },
      uglify_embedded: {
        files: [
          'static/dist/js/map-embedded.js',
          'static/dist/js/map-embedded-nojq.js'
        ],
        tasks: ['uglify:embedded', 'uglify:embedded_nojq']
      },
      upload_dist: {
        files: [
          'static/dist/css/mobile.css',
          'static/src/scss/jqm-themes/cm-jqm-theme.css',
          'static/dist/js/mobile.min.js',
          'static/dist/js/constants.min.js',
          'static/dist/js/common.min.js',
          'static/dist/js/app.min.js'
        ],
        tasks: ['sftp:dist']
      },
      upload_embedded: {
        files: [
          'static/dist/js/map-embedded.js',
          'static/dist/js/map-embedded.min.js',
          'static/dist/js/map-embedded-nojq.js',
          'static/dist/js/map-embedded-nojq.min.js',
          'static/dist/css/embedded.css'
        ],
        tasks: ['sftp:embedded']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ssh');

  // Default (dist only; non-embedded) tasks
  grunt.registerTask('default', ['concat:dist', 'uglify:dist', 'sass:dist', 'sftp:dist']);
  // All tasks
  grunt.registerTask('all', ['concat', 'uglify', 'sass', 'sftp']);
  // Embedded tasks only
  grunt.registerTask('embedded', ['concat:embedded', 'concat:embedded_nojq', 'uglify:embedded', 'uglify:embedded_nojq', 'sass:embedded', 'sftp:embedded']);
  // Embedded tasks only, without uglify
  grunt.registerTask('embedded_nougly', ['concat:embedded', 'concat:embedded_nojq', 'sass:embedded', 'sftp:embedded']);

};
