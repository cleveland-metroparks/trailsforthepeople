module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    local: grunt.file.readJSON('grunt-local-config.json'),
    uglify: {
      dist: {
        files: {
          'static/mobile/mobile.jscompress.js': ['static/mobile/mobile.js'],
          'static/common/constants.jscompress.js': ['static/common/constants.js'],
          'static/common/common.jscompress.js': ['static/common/common.js']
        }
      }
    },
    sass: {
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
            "static/common/constants.jscompress.js",
            "static/common/common.jscompress.js"
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
          'static/common/constants.js',
          'static/common/common.js'
        ],
        tasks: ['uglify']
      },
      upload: {
        files: [
          'static/mobile/mobile.css',
          'static/mobile/jqm-themes/cm-jqm-theme.css',
          'static/mobile/mobile.jscompress.js',
          'static/common/constants.jscompress.js',
          'static/common/common.jscompress.js'
        ],
        tasks: ['sftp']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ssh');

  // Default tasks
  grunt.registerTask('default', ['uglify', 'sass', 'sftp']);

};
