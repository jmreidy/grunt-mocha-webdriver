var assert = require('assert'),
    fs = require('fs'),
    path = require('path');

describe('Phantomjs browser', function () {

  after(function() {
    fs.unlinkSync('phantom.log');
  });
  
  it('should allow to pass phantomjs start flags', function (done) {
    var searchBox;
    var browser = this.browser;
    browser.get('http://www.google.com')
      .then(function() {
        assert.ok(fs.statSync('phantom.log').isFile());
      })
      .nodeify(done);
  });
});

