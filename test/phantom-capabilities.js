var assert = require('assert'),
    fs = require('fs'),
    path = require('path');

describe('Phantomjs browser', function () {


  it('should allow to pass phantomjs capabilities', function (done) {
    var searchBox;
    var browser = this.browser;
    browser.get('http://beta.saadtazi.com/api/echo/headers.html')
      .elementsByCssSelector('.grunt-mocha-webdriver-header')
      .then(function(elts) {
        assert.equal(elts.length, 1);
      })
      .then(done, done);
  });
});

