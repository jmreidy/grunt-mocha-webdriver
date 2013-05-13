module.exports = function (grunt) {
  'use strict';
  // Project configuration.
  grunt.initConfig({

    jshint: {
      all: ['Gruntfile.js', 'tasks/**/*.js', 'test/*.js'],
      options: {
        curly: true,
        eqeqeq: true,
        es5: true,
        immed: true,
        indent: 2,
        latedef: true,
        newcap: true,
        noarg: true,
        node: true,
        nonew: true,
        sub: true,
        undef: true,
        predef: [
          "describe",
          "it",
          "before",
          "beforeEach",
          "after",
          "afterEach",
          "browser"
        ]
      }
    },

    mochaWD: {
      src: ['test/sanity.js'],
      options: {
        timeout: 10000,
        reporter: 'spec'
      },
      basic: {
      }
    }
  });

  // Load local tasks.
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('test', ['mochaWD']);
  grunt.registerTask('default', ['jshint', 'test']);
};
