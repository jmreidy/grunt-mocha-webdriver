'use strict';

var wd = require('wd');
var SauceTunnel = require('sauce-tunnel');
var _ = require('grunt').util._;
var async = require('async');
var runner = require('./lib/mocha-runner');
var phantom = require('phantomjs');
var childProcess = require('child_process');

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
      testName: "",
      testTags: [],
      tunnelFlags: null
    });

    grunt.util.async.forEachSeries(this.files, function (fileGroup, next) {
      if (opts.usePhantom) {
        runTestsOnPhantom(fileGroup, opts, next);
      }
      else if (opts.hostname) {
        runTestsOnSelenium(fileGroup, opts, next);
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
    opts.wd = wd;
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
    var browser;
    var phantomPort = opts.phantomPort? opts.phantomPort : 4444;

    if (opts.usePromises) {
      browser = wd.promiseChainRemote({port: phantomPort});
    }
    else {
      browser = wd.remote({port: phantomPort});
    }
    grunt.log.writeln('Running webdriver tests against PhantomJS.');

    startPhantom(phantomPort, opts.ignoreSslErrors, function (err, phantomProc) {
      if (err) { return next(err); }
      browser.init({}, function () {
        runTestsForBrowser(opts, fileGroup, browser, function (err) {
          phantomProc.on('close', function () {
            grunt.log.writeln('Phantom exited.');
            next(err);
          });
          phantomProc.kill();
        });
      });
    });

  }

  function startPhantom(port, ignoreSslErrors, next) {
    var phantomOpts = ['--webdriver', port];
    if (ignoreSslErrors) {
      phantomOpts.push('--ignore-ssl-errors', 'yes');
    }
    var process = childProcess.execFile(phantom.path, phantomOpts);
    process.stdout.setEncoding('utf8');
    var onPhantomData = function (data) {
      if (data.match(/running/i)) {
        grunt.log.writeln('PhantomJS started.');
        process.stdout.removeListener('data', onPhantomData);
        next(null, process);
      }
      else if (data.match(/error/i)) {
        grunt.log.error('Error starting PhantomJS');
        next(new Error(data));
      }
    };
    process.stdout.on('data', onPhantomData);
  }

  /**
   * Extracts wd connection params from grunt options
   *
   * Utility function that returns named params
   * that can be used by wd.remote or wd.promiseChainRemote
   */
  function extractConnectionInfo(opts) {
    var params = {};
    params.hostname = opts.hostname || 'ondemand.saucelabs.com';
    params.port     = opts.port || 80;
    if (opts.key) {
      params.accessKey = opts.key;
    }
    ['auth', 'username'].forEach(function(prop) {
      if (opts[prop]) {
        params[prop] = opts[prop];
      }
    });
    return params;
  }

  /**
   * Init a browser
   */
  function initBrowser(browserOpts, opts, mode, fileGroup, cb) {
    var funcName = opts.usePromises ? 'promiseChainRemote': 'remote',
    browser = wd[funcName](extractConnectionInfo(opts));

    browser.browserTitle = browserOpts.browserTitle;
    browser.mode = mode;

    browser.mode = mode;
    if (opts.testName) {
      browserOpts.name = opts.testName;
    }
    if (opts.testTags) {
      browserOpts.tags = opts.testTags;
    }
    if (opts.identifier) {
      browserOpts['tunnel-identifier'] = opts.identifier;
    }

    browser.init(browserOpts, function (err) {
      if (err) {
        grunt.log.error('Could not initialize browser - ' + mode);
        return cb(false);
      }
      runTestsForBrowser(opts, fileGroup, browser, cb);
    });
  }

  // used by runTestsOnSaucelabs or runTestsOnSeleni
  var browserFailed = false;

  function pushToQueue(testQueue, browserOpts, browserTitle) {
    testQueue.push(browserOpts, function (err) {
      if (err) {
        browserFailed = true;
      }
      grunt.log.verbose.writeln('%s test complete, %s tests remaining', browserTitle, testQueue.length());
    });
  }

  function startBrowserTests(testQueue, mode, browserOpts) {
    var browserTitle = ''+browserOpts.browserName;
    if (browserOpts.version) {
      browserTitle = browserTitle + ' ' + browserOpts.version;
    }
    if (browserOpts.platform) {
      browserTitle = browserTitle + ' on ' + browserOpts.platform;
    }
    browserOpts.browserTitle = browserTitle;
    grunt.log.verbose.writeln('Queueing ' + browserTitle + ' - ' + mode);
    pushToQueue(testQueue, browserOpts, browserTitle);
  }

  function runTestsOnSaucelabs(fileGroup, opts, next) {
    if (opts.browsers) {
      var tunnel = new SauceTunnel(opts.username, opts.key, opts.identifier, true, opts.tunnelFlags);
      configureLogEvents(tunnel);

      grunt.log.writeln("=> Connecting to Saucelabs ...");

      tunnel.start(function(isCreated) {
        if (!isCreated) {
          return next(new Error('Failed to create Sauce tunnel.'));
        }
        grunt.log.ok("Connected to Saucelabs.");

        var testQueue = async.queue(function (browserOpts, cb) {
          // browserOpts, opts, usePromises, errorMsg, fileGroup, cb
          initBrowser(browserOpts,
                      opts,
                      "saucelabs",
                      fileGroup,
                      cb);
        }, opts.concurrency);

        opts.browsers.forEach(function(browserOpts) {
          startBrowserTests(testQueue, 'saucelabs', browserOpts);
        });

        testQueue.drain = function () {
          var err;
          if (browserFailed) {
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

  function runTestsOnSelenium(fileGroup, opts, next) {
    if (opts.browsers) {
      grunt.log.writeln("=> Connecting to Selenium ...");

      var testQueue = async.queue(function (browserOpts, cb) {
        var browser = initBrowser(browserOpts,
                                  opts,
                                  "selenium",
                                  fileGroup,
                                  cb);
      }, opts.concurrency);

      opts.browsers.forEach(function (browserOpts) {
        startBrowserTests(testQueue, 'selenium', browserOpts);
      });

      testQueue.drain = function () {
        var err;
        if (browserFailed) {
          err = new Error('One or more tests on Selenium failed.');
        }
        next(err);
      };

    }
    else {
      grunt.log.writeln('No browsers configured for running on Saucelabs.');
    }
  }
};

//wd.js monkey patch for clearer errors
var _newError = wd.webdriver.prototype._newError;
wd.webdriver.prototype._newError = function (opts) {
  var err = _newError(opts);
  try {
    err = new Error(err.cause.value.message
      .match(/([\s\S]*) caused/)[1]
      .match(/'([\s\S]*)'\n/)[1]
    );
  }
  catch (e) {}
  return err;
};
