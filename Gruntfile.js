module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      dist: {
        files: {
          //'static/mobile/mobile.jscompress.js': ['static/mobile/mobile.js'],
          //'static/desktop/desktop.jscompress.js': ['static/desktop/desktop.js'],
          //'static/common/constants.jscompress.js': ['static/common/constants.js'],
          //'static/desktop/common.jscompress.js': ['static/desktop/common.js']
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
          'static/mobile/jqm-themes/cm-jqm-theme.css': 'static/mobile/jqm-themes/cm-jqm-theme.scss'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-sass');

  // Default tasks
  grunt.registerTask('default', ['uglify', 'sass']);

};