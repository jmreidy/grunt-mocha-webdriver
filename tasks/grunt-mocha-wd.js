'use strict';

var wd = require('wd');
var Mocha = require('mocha');
var path = require('path');

/*
 * grunt-mocha-sauce
 * https://github.com/jmreidy/grunt-mocha-sauce
 *
 * Copyright (c) 2013 Justin Reidy
 * Licensed under the MIT license
 */

module.exports = function (grunt) {
  grunt.registerMultiTask('mochaWD', 'Run mocha tests against PhantomJS and SauceLabs', function () {

    var opts = this.options();

    grunt.util.async.forEachSeries(this.files, function (fileGroup, next) {
      var browser = wd.remote();

      browser.init({}, function () {

        var mocha = new Mocha(opts);
        mocha.suite.on('pre-require', function (context, file, m) {
          context.browser = browser;
        });

        grunt.file.expand({filter: 'isFile'}, fileGroup.src).forEach(function (f) {
          mocha.addFile(path.resolve(f));
        });

        try {
          mocha.run(function(errCount) {
            browser.quit();
            console.log('here');
            next(errCount === 0);
          });
        } catch (e) {
          browser.quit();
          grunt.log.error("Mocha failed to run");
          grunt.log.error(e.stack);
          next(false);
        }
      });

    }, this.async());
  });
};
