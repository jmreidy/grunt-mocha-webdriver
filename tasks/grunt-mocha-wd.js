'use strict';

var wd = require('wd');
var SauceTunnel = require('sauce-tunnel');
var _ = require('grunt').util._;
var async = require('async');

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
      testTimeout: (1000 * 60 * 5),
      tunnelTimeout: 120,
      testInterval: 1000 * 5,
      testReadyTimeout: 1000 * 5,
      testName: "",
      testTags: []
    });

    grunt.util.async.forEachSeries(this.files, function (fileGroup, next) {
      if (opts.usePhantom) {
        runTestsOnPhantom(fileGroup, opts, next);
      }
      else {
        runTestsOnSaucelabs(fileGroup, opts, next);
      }
    }, this.async());
  });


  function runTestsForBrowser(opts, fileGroup, browser, next) {
    var onTestFinish = function(err) {
      browser.quit();
      next(err);
    };
    var runner = require('./mocha-runner');
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

  function runTestsOnPhantom(fileGroup, opts, next) {
    var browser = wd.remote();
    grunt.log.writeln('Running webdriver tests against PhantomJS.');
    browser.init({}, function () {
      runTestsForBrowser(opts, fileGroup, browser, next);
    });
  }

  function runTestsOnSaucelabs(fileGroup, opts, next) {
    if (opts.browsers) {
      var tunnel = new SauceTunnel(opts.username, opts.key, opts.identifier, true, opts.tunnelTimeout);
      configureLogEvents(tunnel);

      grunt.log.writeln("=> Connecting to Saucelabs ...");

      tunnel.start(function(isCreated) {
        if (!isCreated) return next(false);
        grunt.log.ok("Connected to Saucelabs.");

        var browsers = [];
        var testQueue = async.queue(function (browserOpts, cb) {
          var browser = wd.remote('ondemand.saucelabs.com', 80, opts.username, opts.key);
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
            grunt.log.writeln('Running tests on %s', browserOpts.browserTitle);
            runTestsForBrowser(opts, fileGroup, browser, cb);
            browsers.push(browser);
          });
        }, opts.concurrency);

        opts.browsers.forEach(function (browserOpts) {
          var browserTitle = ''+browserOpts.browserName + ' ' + browserOpts.version + ' on ' + browserOpts.platform;
          browserOpts.browserTitle = browserTitle;
          grunt.log.verbose.writeln('Queueing ' + browserTitle + ' on Saucelabs.');
          testQueue.push(browserOpts, function (err) {
            if (err) {
              grunt.log.error('Tests failed for browser %s', browserTitle);
              browsers.forEach(function (b) { b.quit() });
              return tunnel.stop(function () { next(err) });
            }
            grunt.log.verbose.writeln('%s test complete, %s tests remaining', browserTitle, testQueue.length());
          });
        });

        testQueue.drain = function () {
          tunnel.stop(function () {
            next();
          });
        }
      });
    }
    else {
      grunt.log.writeln('No browsers configured for running on Saucelabs.');
    }
  }

};
