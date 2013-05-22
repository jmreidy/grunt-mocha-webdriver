var Mocha = require('mocha');
var path = require('path');
var Module = require('module');
var SauceReporter = require('./mocha-sauce-reporter');

module.exports = function (opts, fileGroup, browser, grunt, onTestFinish) {
  //browserTitle means we're on a SL test
  if (browser.browserTitle) {
    opts.reporter = SauceReporter(browser);
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
