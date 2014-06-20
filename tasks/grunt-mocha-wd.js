'use strict';

var wd = require('wd');
var SauceTunnel = require('sauce-tunnel');
var _ = require('grunt').util._;
var async = require('async');
var runner = require('./lib/mocha-runner');
var phantom = require('phantomjs');
var childProcess = require('child_process');
var BaseReporter = require('mocha').reporters.Base;
var seleniumLauncher = require('selenium-launcher');
var color = BaseReporter.color;

/*
 * grunt-mocha-sauce
 * https://github.com/jmreidy/grunt-mocha-sauce
 *
 * Copyright (c) 2014 Justin Reidy
 * Licensed under the MIT license
 */
module.exports = function (grunt) {
  grunt.registerMultiTask('mochaWebdriver', 'Run mocha tests against PhantomJS and Sauce Labs', function () {

    var opts = this.options({
      username: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
      identifier: Math.floor((new Date()).getTime() / 1000 - 1230768000).toString(),
      concurrency: 1,
      testName: "",
      testTags: [],
      build: process.env.TRAVIS_BUILD_NUMBER || process.env.BUILD_NUMBER || process.env.BUILD_TAG || process.env.CIRCLE_BUILD_NUM,
      tunnelFlags: null,
      secureCommands: false,
      phantomCapabilities: {},
      phantomFlags: []
    });

    grunt.util.async.forEachSeries(this.files, function (fileGroup, next) {
      if (opts.usePhantom) {
        runTestsOnPhantom(fileGroup, opts, next);
      }
      else if (opts.autoInstall || opts.hostname && !opts.secureCommands) {
        runTestsOnSelenium(fileGroup, opts, next);
      }
      else {
        runTestsOnSaucelabs(fileGroup, opts, next);
      }
    }, this.async());
  });


  function runTestsForBrowser(opts, fileGroup, browser, next) {
    var onTestFinish = function(err) {
      // report mocha test failure
      var callback = function() {
        next(err);
      };
      if (opts.usePromises) {
        browser.quit().nodeify(callback);
      }
      else {
        browser.quit(callback);
      }
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
    var phantomCapabilities = opts.phantomCapabilities;
    if (opts.usePromises) {
      browser = wd.promiseChainRemote({port: phantomPort});
    }
    else {
      browser = wd.remote({port: phantomPort});
    }
    grunt.log.writeln('Running webdriver tests against PhantomJS.');

    startPhantom(phantomPort, opts, function (err, phantomProc) {
      if (err) { return next(err); }
      browser.init(phantomCapabilities, function () {
        runTestsForBrowser(opts, fileGroup, browser, function (err) {

          function onClose() {
            grunt.log.writeln('Phantom exited.');
            next(err);
          }

          // the process might already be closed due to an internal crash,
          // so check first is already killed to avoid a deadlock.
          if (phantomProc.killed) {
            onClose();
          }
          else {
            phantomProc.on('close', function() {
              onClose();
            });

            phantomProc.kill();
          }
        });
      });
    });

  }

  function startPhantom(port, opts, next) {
    var phantomOpts = opts.phantomFlags || [];
    phantomOpts.push('--webdriver', port);
    if (opts.ignoreSslErrors) {
      phantomOpts.push('--ignore-ssl-errors', 'yes');
    }
    var phantomProc = childProcess.execFile(phantom.path, phantomOpts);
    var stopPhantomProc = function() {
      phantomProc.kill();
    };
    // stop child phantomjs process when interrupting master process
    process.on('SIGINT', stopPhantomProc);

    phantomProc.on('exit', function () {
      process.removeListener('SIGINT', stopPhantomProc);
    });
    phantomProc.stdout.setEncoding('utf8');
    var onPhantomData = function (data) {
      if (data.match(/running/i)) {
        grunt.log.writeln('PhantomJS started.');
        phantomProc.stdout.removeListener('data', onPhantomData);
        next(null, phantomProc);
      }
      else if (data.match(/error/i)) {
        grunt.log.error('Error starting PhantomJS');
        next(new Error(data));
      }
    };
    phantomProc.stdout.on('data', onPhantomData);
  }

  /**
   * Extracts wd connection params from grunt options
   *
   * Utility function that returns named params
   * that can be used by wd.remote or wd.promiseChainRemote
   */
  function extractConnectionInfo(opts) {
    var params = {};
    var defaultServer = opts.secureCommands ?
                        { hostname: '127.0.0.1', port: 4445 } :
                        { hostname: 'ondemand.saucelabs.com', port: 80 };

    params.hostname = opts.hostname || defaultServer.hostname;
    params.port     = opts.port || defaultServer.port;
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
    var funcName = opts.usePromises ? 'promiseChainRemote': 'remote';
    var browser = wd[funcName](extractConnectionInfo(opts));
    browser.browserTitle = browserOpts.browserTitle;
    browser.mode = mode;

    browser.mode = mode;
    if (opts.testName) {
      browserOpts.name = opts.testName;
    }
    if (opts.testTags) {
      browserOpts.tags = opts.testTags;
    }
    if (opts.build) {
      browserOpts.build = opts.build;
    }
    if (opts.identifier) {
      browserOpts['tunnel-identifier'] = opts.identifier;
    }

    browser.init(browserOpts, function (err) {
      if (err) {
        grunt.log.error('Could not initialize browser - ' + mode);
        grunt.log.error('Make sure Sauce Labs supports the following browser/platform combo' +
                        ' on ' + color('bright yellow', 'saucelabs.com/platforms') + ': ' + browserOpts.browserTitle);
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

      grunt.log.writeln("=> Connecting to Sauce Labs ...");

      tunnel.start(function(isCreated) {
        if (!isCreated) {
          return next(new Error('Failed to create Sauce tunnel.'));
        }
        grunt.log.ok("Connected to Sauce Labs.");

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
    var seleniumServers = [];
    if (opts.browsers) {
      grunt.log.writeln("=> Connecting to Selenium ...");
        var testQueue = async.queue(function (browserOpts, cb) {
          function afterSelenium () {
            var browser = initBrowser(browserOpts,
                                      opts,
                                      "selenium",
                                      fileGroup,
                                      cb);
          }
          if (opts.autoInstall) {
            seleniumLauncher({ chrome: browserOpts.browserName === 'chrome' }, function(err, selenium) {
              seleniumServers.push(selenium);
              grunt.log.writeln('Selenium Running');
              if(err){
                selenium.exit();
                grunt.fail.fatal(err);
                return;
              }
              opts.port = selenium.port;
              afterSelenium();
            }, opts.concurrency);
          } else {
            afterSelenium();
          }
        }, opts.autoInstall ? Object.keys(opts.browsers).length : 1);

      opts.browsers.forEach(function (browserOpts) {
        startBrowserTests(testQueue, 'selenium', browserOpts);
      });

      testQueue.drain = function () {
        var err;
        seleniumServers.forEach(function(seleniumServer) {
          seleniumServer.kill();
        });
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
