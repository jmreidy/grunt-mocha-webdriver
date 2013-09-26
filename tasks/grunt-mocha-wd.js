'use strict';

var wd = require('wd');
var SauceTunnel = require('sauce-tunnel');
var _ = require('grunt').util._;
var async = require('async');
var runner = require('./lib/mocha-runner');
var child = require('child_process');
var phantomjs = require('phantomjs');

/*
 * grunt-mocha-sauce
 * https://github.com/jmreidy/grunt-mocha-sauce
 *
 * Copyright (c) 2013 Justin Reidy
 * Licensed under the MIT license
 */
module.exports = function (grunt) {
  grunt.registerMultiTask('mochaWebdriver', 'Run mocha tests against PhantomJS and SauceLabs', function () {

    var opts = this.options({
      username: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
      identifier: Math.floor((new Date()).getTime() / 1000 - 1230768000).toString(),
      concurrency: 1,
      tunnelTimeout: 120,
      testName: "",
      testTags: []
    });

    grunt.util.async.forEachSeries(this.files, function (fileGroup, next) {
      if (opts.usePhantom) {
        var process = startPhantomJS(function () {
          runTestsOnPhantom(fileGroup, opts, next, function () {
            process.kill();
          });
        });
      }
      else {
        runTestsOnSaucelabs(fileGroup, opts, next);
      }
    }, this.async());
  });


  function runTestsForBrowser(opts, fileGroup, browser, next, cb) {
    var onTestFinish = function(err) {
      browser.quit();
      next(err);
      if (cb) {
        cb();
      }
    };
    runner(opts, fileGroup, browser, grunt, onTestFinish);
  }

  function configureLogEvents(tunnel) {
    var methods = ['write', 'writeln', 'error', 'ok', 'debug'];
    methods.forEach(function (method) {
      tunnel.on('log:'+method, function (text) {
        grunt.log[method](text);
      });
      tunnel.on('verbose:'+method, function (text) {
        grunt.verbose[method](text);
      });
    });
  }

  function startPhantomJS(cb) {
    var process = child.execFile(phantomjs.path, ['--webdriver=4444']);
    process.stdout.setEncoding('utf8');
    process.stdout.on('data', function (data) {
      if (/running/i.test(data) && cb) {
        cb();
      } else if (/error/i.test(data)) {
        console.log('Error starting PhantomJS');
      }
    });
    return process;
  }

  function runTestsOnPhantom(fileGroup, opts, next, cb) {
    var browser;
    if (opts.usePromises) {
      browser = wd.promiseRemote();
    }
    else {
      browser = wd.remote();
    }
    grunt.log.writeln('Running webdriver tests against PhantomJS.');
    browser.init({}, function () {
      runTestsForBrowser(opts, fileGroup, browser, next, cb);
    });
  }

  function runTestsOnSaucelabs(fileGroup, opts, next) {
    if (opts.browsers) {
      var tunnel = new SauceTunnel(opts.username, opts.key, opts.identifier, true, opts.tunnelTimeout);
      configureLogEvents(tunnel);

      grunt.log.writeln("=> Connecting to Saucelabs ...");

      tunnel.start(function(isCreated) {
        if (!isCreated) {
          return next(new Error('Failed to create Sauce tunnel.'));
        }
        grunt.log.ok("Connected to Saucelabs.");

        var browser_failed = false;
        var testQueue = async.queue(function (browserOpts, cb) {
          var browser;
          if (opts.usePromises) {
            browser = wd.promiseRemote('ondemand.saucelabs.com', 80, opts.username, opts.key);
          }
          else {
            browser = wd.remote('ondemand.saucelabs.com', 80, opts.username, opts.key);
          }
          browser.browserTitle = browserOpts.browserTitle;
          browserOpts = _.extend(browserOpts, {
            name: opts.testName,
            tags: opts.testTags,
            'tunnel-identifier': opts.identifier
          });

          browser.init(browserOpts, function (err) {
            if (err) {
              grunt.log.error("Could not initialize browser on Saucelabs");
              return cb(false);
            }
            runTestsForBrowser(opts, fileGroup, browser, cb);
          });
        }, opts.concurrency);

        opts.browsers.forEach(function (browserOpts) {
          var browserTitle = ''+browserOpts.browserName + ' ' + browserOpts.version + ' on ' + browserOpts.platform;
          browserOpts.browserTitle = browserTitle;
          grunt.log.verbose.writeln('Queueing ' + browserTitle + ' on Saucelabs.');
          testQueue.push(browserOpts, function (err) {
            if (err) {
              browser_failed = true;
            }
            grunt.log.verbose.writeln('%s test complete, %s tests remaining', browserTitle, testQueue.length());
          });
        });

        testQueue.drain = function () {
          var err;
          if (browser_failed) {
            err = new Error('One or more tests on Sauce Labs failed.');
          }
          tunnel.stop(function () {
            next(err);
          });
        };
      });
    }
    else {
      grunt.log.writeln('No browsers configured for running on Saucelabs.');
    }
  }

};
