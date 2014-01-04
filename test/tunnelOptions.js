var assert = require('assert'),
    fs = require('fs'),
    path = require('path');

describe('Tunnel option flags', function () {

  
  it('should perform as expected', function (done) {
    var searchBox;
    var browser = this.browser;
    browser.get('http://google.com')
      .then(function() {
        assert(fs.existsSync(path.join(__dirname, '../sauce_connect.log.custom')), 'custom log file does not exist');
      })
      .then(done, done);
  });
});
