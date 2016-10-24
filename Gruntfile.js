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
        }
      }
    },
    watch: {
      css: {
        files: ['static/mobile/mobile.scss'],
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
