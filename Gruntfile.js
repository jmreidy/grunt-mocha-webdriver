'use strict';

module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({

    jshint: {
      all: ['Gruntfile.js', 'tasks/**/*.js', 'test/*.js'],
      options: {
        jshintrc: true
      }
    },

    mochaWebdriver: {
      options: {
        timeout: 1000 * 60 * 3,
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
      phantomCapabilities: {
        src: ['test/phantom-capabilities.js'],
        options: {
          testName: 'phantom capabilities test',
          usePhantom: true,
          phantomPort: 5555,
          usePromises: true,
          // see https://github.com/detro/ghostdriver
          phantomCapabilities: {
              'phantomjs.page.settings.userAgent': 'customUserAgent',
              'phantomjs.page.customHeaders.grunt-mocha-webdriver-header': 'VALUE'
          }
        }
      },
      phantomFlag: {
        src: ['test/phantom-flags.js'],
        options: {
          testName: 'phantom flags test',
          usePhantom: true,
          phantomPort: 5555,
          usePromises: true,
          phantomFlags: [
            '--webdriver-logfile', 'phantom.log'
          ]
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
          testTags: ['mochaWebDriver'],
          build: 'testBuild',
          browsers: [
            {browserName: 'internet explorer', platform: 'Windows 7', version: '9'},
            {browserName: 'internet explorer', platform: 'Windows 7', version: '8'},
            {browserName: 'chrome', platform: 'Windows 7', version: ''}
          ]
        }
      },
      tunnelOptions: {
        src: ['test/tunnelOptions.js'],
        options: {
          // changing log file to sauce_connect.log.custom
          tunnelFlags: ['-l', 'sauce_connect.log.custom'],
          testName: 'sauce tunnel flags test',
          concurrency: 2,
          usePromises: true,
          browsers: [
            {browserName: 'internet explorer', platform: 'Windows 7', version: '9'}
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
      },
      sauceSecure: {
        src: ['test/promiseAPi.js'],
        options: {
          testName: 'sauce secure commands test',
          secureCommands: true,
          usePromises: true,
          browsers: [
            {browserName: 'chrome', platform: 'Windows 7', version: ''}
          ]
        }
      },
      selenium: {
        src: ['test/sanity.js'],
        options: {
          testName: 'selenium test',
          concurrency: 2,
          hostname: '127.0.0.1',
          port:   '4444',
          autoInstall: true,
          browsers: [
            {browserName: 'firefox'},
            // {browserName: 'internet explorer', platform: 'Windows 7', version: '8'},
            {browserName: 'chrome'}
          ]
        }
      },
      seleniumPromises: {
        src: ['test/promiseAPi.js'],
        options: {
          testName: 'selenium promises test',
          concurrency: 2,
          usePromises: true,
          hostname: '127.0.0.1',
          port:   '4444',
          browsers: [
            {browserName: 'firefox'},
            {browserName: 'chrome'}
          ]
        }
      }
    }
  });

  // Load local tasks.
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('test', [  'jshint',
                                'mochaWebdriver:phantom',
                                'mochaWebdriver:phantomCapabilities',
                                'mochaWebdriver:promises',
                                'mochaWebdriver:requires',
                                'mochaWebdriver:sauce',
                                'mochaWebdriver:tunnelOptions',
                                'mochaWebdriver:saucePromises'
                              ]);

  grunt.registerTask('testSelenium', ['mochaWebdriver:selenium', 'mochaWebdriver:seleniumPromises']);
  grunt.registerTask('default', ['jshint', 'test']);
};
