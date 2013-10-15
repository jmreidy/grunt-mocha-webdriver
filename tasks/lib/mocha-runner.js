var Mocha = require('mocha');
var path = require('path');
var Module = require('module');
var generateSauceReporter = require('./mocha-sauce-reporter');
var fs = require('fs');
var path = require('path');

module.exports = function (opts, fileGroup, browser, grunt, onTestFinish) {
  //browserTitle means we're on a SL test
  if (browser.browserTitle) {
    opts.reporter = generateSauceReporter(browser);
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

  mocha.suite.on('pre-require', function (context, file, m) {
    this.ctx.browser = browser;
  });

  grunt.file.expand({filter: 'isFile'}, fileGroup.src).forEach(function (f) {
    var filePath = path.resolve(f);
    if (Module._cache[filePath]) {
      delete Module._cache[filePath];
    }
    mocha.addFile(filePath);
  });

  try {
    mocha.run(function(errCount) {
      var err;
      if (errCount !==0) {
        err = new Error('Tests encountered ' + errCount + ' errors.');
      }
      onTestFinish(err);
    });
  } catch (e) {
    grunt.log.error("Mocha failed to run");
    grunt.log.error(e.stack);
    onTestFinish(false);
  }
};
