module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
          'static/mobile/jqm-themes/cm-jqm-theme.min.css': 'static/mobile/jqm-themes/cm-jqm-theme.css',
        }
      }
    },
    watch: {
      css: {
        files: ['static/mobile/mobile.scss'],
        files: ['static/mobile/jqm-themes/cm-jqm-theme.css'],
        tasks: ['sass']
      },
      js: {
        files: [
          'static/mobile/mobile.js',
          'static/common/constants.js',
          'static/common/common.js'
          ],
        tasks: ['uglify']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default tasks
  grunt.registerTask('default', ['uglify', 'sass']);

};
