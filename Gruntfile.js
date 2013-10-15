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
        proto: true,
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

    mochaWebdriver: {
      options: {
        timeout: 1000 * 60,
        reporter: 'spec'
      },
      phantom: {
        src: ['test/sanity.js'],
        options: {
          testName: 'phantom test',
          usePhantom: true,
          phantomPort: 5555
        }
      },
      promises: {
        src: ['test/promiseAPi.js'],
        options: {
          testName: 'phantom test',
          usePhantom: true,
          usePromises: true
        }
      },
      requires: {
        src: ['test/requires.js'],
        options: {
          testName: 'phantom requires test',
          usePhantom: true,
          require: ['test/support/index.js']
        }
      },
      sauce: {
        src: ['test/sanity.js'],
        options: {
          testName: 'sauce test',
          concurrency: 2,
          browsers: [
            {browserName: 'internet explorer', platform: 'Windows 7', version: '9'},
            {browserName: 'internet explorer', platform: 'Windows 7', version: '8'},
            {browserName: 'chrome', platform: 'Windows 7', version: ''}
          ]
        }
      },
      saucePromises: {
        src: ['test/promiseAPi.js'],
        options: {
          testName: 'sauce promises test',
          concurrency: 2,
          usePromises: true,
          browsers: [
            {browserName: 'internet explorer', platform: 'Windows 7', version: '9'},
            {browserName: 'internet explorer', platform: 'Windows 7', version: '8'},
            {browserName: 'chrome', platform: 'Windows 7', version: ''}
          ]
        }
      }
    }
  });

  // Load local tasks.
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('test', ['mochaWebdriver']);
  grunt.registerTask('default', ['jshint', 'test']);
};
