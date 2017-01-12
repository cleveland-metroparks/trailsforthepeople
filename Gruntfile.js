module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    local: grunt.file.readJSON('grunt-local-config.json'),
    concat: {
      // Main package:
      dist: {},
      // Map embeds on external sites:
      embedded: {
        src: [
          'static/common/libraries/jquery-1.12.4.min.js',
          'static/common/libraries/jquery.mobile-1.4.5/jquery.mobile-1.4.5.js',
          'static/mobile/jqm.autoComplete-1.5.1-min.js',
          'static/common/libraries/purl.js',
          'static/common/libraries/leaflet-1.0.2/leaflet.js',
          'static/lib/mapbox.js-2.4.0/mapbox.standalone.js',
          'static/lib/mapbox-gl-0.28.0.js',
          'static/common/libraries/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
          'static/common/libraries/cookie.js',
          'static/common/js/constants.jscompress.js',
          'static/common/js/common.jscompress.js',
          'static/mobile/mobile.jscompress.js'
        ],
        dest: 'static/dist/js/map-embedded.js'
      },
      // Map embeds on external sites that already have jQuery included (we don't package it):
      embedded_nojq: {
        src: [
          'static/common/libraries/jquery.mobile-1.4.5/jquery.mobile-1.4.5.js',
          'static/mobile/jqm.autoComplete-1.5.1-min.js',
          'static/common/libraries/purl.js',
          'static/common/libraries/leaflet-1.0.2/leaflet.js',
          'static/lib/mapbox.js-2.4.0/mapbox.standalone.js',
          'static/lib/mapbox-gl-0.28.0.js',
          'static/common/libraries/mapbox-gl-leaflet/leaflet-mapbox-gl.js',
          'static/common/libraries/cookie.js',
          'static/common/js/constants.jscompress.js',
          'static/common/js/common.jscompress.js',
          'static/mobile/mobile.jscompress.js'
        ],
        dest: 'static/dist/js/map-embedded-nojq.js'
      }
    },
    uglify: {
      // Main package:
      dist: {
        files: {
          'static/mobile/mobile.jscompress.js': ['static/mobile/mobile.js'],
          'static/common/js/constants.jscompress.js': ['static/common/js/constants.js'],
          'static/common/js/common.jscompress.js': ['static/common/js/common.js']
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
    sass: {
      // Main package:
      dist: {
        options: {
          style: 'compact'
        },
        files: {
          'static/mobile/mobile.css': 'static/mobile/mobile.scss',
          'static/mobile/jqm-themes/cm-jqm-theme.min.css': 'static/mobile/jqm-themes/cm-jqm-theme.css'
        }
      }
    },
    sftp: {
      test: {
        files: {
          "./": [
            "static/mobile/mobile.css",
            "static/mobile/jqm-themes/cm-jqm-theme.min.css",
            "static/mobile/mobile.jscompress.js",
            "static/common/js/constants.jscompress.js",
            "static/common/js/common.jscompress.js",
            "static/dist/js/map-embedded.js",
            "static/dist/js/map-embedded.min.js",
            "static/dist/js/map-embedded-nojq.js",
            "static/dist/js/map-embedded-nojq.min.js"
          ]
        },
        options: {
          path: '<%= local.remoteHost.path %>',
          host: '<%= local.remoteHost.hostname %>',
          port: '<%= local.remoteHost.port %>',
          username: '<%= local.remoteHost.username %>',
          password: '<%= local.remoteHost.password %>',
          showProgress: true,
          readyTimeout: '<%= local.remoteHost.readyTimeout %>'
        }
      }
    },
    watch: {
      compile_sass: {
        files: [
          'static/mobile/mobile.scss',
          'static/mobile/jqm-themes/cm-jqm-theme.css'
        ],
        tasks: ['sass']
      },
      uglify_js: {
        files: [
          'static/mobile/mobile.js',
          'static/common/js/constants.js',
          'static/common/js/common.js'
        ],
        tasks: ['uglify']
      },
      upload: {
        files: [
          'static/mobile/mobile.css',
          'static/mobile/jqm-themes/cm-jqm-theme.css',
          'static/mobile/mobile.jscompress.js',
          'static/common/js/constants.jscompress.js',
          'static/common/js/common.jscompress.js'
        ],
        tasks: ['sftp']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ssh');

  // Default tasks
  grunt.registerTask('default', ['concat', 'uglify', 'sass', 'sftp']);

};
