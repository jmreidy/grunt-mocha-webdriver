var assert = require('assert'),
    fs = require('fs'),
    path = require('path');

describe('Phantomjs browser', function () {

  
  it('should allow to pass phantomjs capabilities', function (done) {
    var searchBox;
    var browser = this.browser;
    browser.get('http://whatsmyua.com/')
      .elementByCssSelector('.ua.success')
      .text()
      .then(function(txt) {
        assert(/customUserAgent/.test(txt));
      })
      .then(done, done);
  });
});

