'use strict';

var Mocha = require('mocha');
var color = Mocha.reporters.Base.color;
var path = require('path');
var Module = require('module');
var generateSauceReporter = require('./mocha-sauce-reporter');
var fs = require('fs');
var path = require('path');
var domain = require('domain');

module.exports = function (opts, fileGroup, browser, grunt, onTestFinish) {
  //browserTitle means we're on a SL test
  if (browser.browserTitle) {
    if (opts.reporter && opts.concurrency > 1) {
      if (!opts.customReporter) {
        console.log(color('medium', 'ignoring "reporter" option because concurrency is > 1'));
        opts.reporter = generateSauceReporter(browser);
      }
    }
    if (opts.customReporter) {
      // to allow customReporter
      // check ./mocha-sauce-reporter or https://github.com/saadtazi/gmwd-teamcity-reporter
      opts.originalReporter = opts.originalReporter || opts.reporter;
      opts.reporter = require(opts.originalReporter)(browser, opts);
    }

  }

  var cwd = process.cwd();
  module.paths.push(cwd, path.join(cwd, 'node_modules'));
  if (opts && opts.require) {
    var mods = opts.require;
    if (!(mods instanceof Array)) { mods = [mods]; }
    mods.forEach(function(mod) {
      var abs = fs.existsSync(mod) || fs.existsSync(mod + '.js');
      if (abs) {
        mod = path.resolve(mod);
      }
      require(mod);
    });
  }

  var mocha = new Mocha(opts);

  mocha.suite.on('pre-require', function () {
    this.ctx.browser = browser;
    this.ctx.wd = opts.wd;
    this.ctx.mochaOptions = opts;
  });

  grunt.file.expand({filter: 'isFile'}, fileGroup.src).forEach(function (f) {
    var filePath = path.resolve(f);
    if (Module._cache[filePath]) {
      delete Module._cache[filePath];
    }
    mocha.addFile(filePath);
  });

  try {
    if (mocha.files.length) {
      mocha.loadFiles();
    }

    var runDomain = domain.create();
    var mochaOptions = mocha.options;
    var mochaRunner = new Mocha.Runner(mocha.suite);
    new mocha._reporter(mochaRunner);
    mochaRunner.ignoreLeaks = (mochaOptions.ignoreLeaks !== false);
    mochaRunner.asyncOnly = mochaOptions.asyncOnly;
    if (mochaOptions.grep) {
      mochaRunner.grep(mochaOptions.grep, mochaOptions.invert);
    }
    if (mochaOptions.globals) {
      mochaRunner.globals(mochaOptions.globals);
    }
    runDomain.on('error', mochaRunner.uncaught.bind(mochaRunner));
    runDomain.run(function () {
      mochaRunner.run(function(errCount) {
        var err;
        if (errCount !==0) {
          err = new Error('Tests encountered ' + errCount + ' errors.');
        }
        onTestFinish(err);
      });
    });
  } catch (e) {
    grunt.log.error("Mocha failed to run");
    onTestFinish(e);
  }
};
