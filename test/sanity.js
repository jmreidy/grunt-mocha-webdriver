var assert = require('assert');
var async = require('async');

describe('A Mocha test run by grunt-mocha-webdriver', function () {

  it('has a browser injected into it', function () {
    assert.ok(this.browser);
  });

  it('has wd injected into it for customizing', function () {
    assert.equal(this.wd, require('wd'));
  });

  it('has mochaOptions injected into it for reuse', function () {
    assert.equal(this.mochaOptions.timeout,  1000 * 60 * 3);
  });

});


describe('A basic Webdriver example', function () {

  describe('injected browser executing a Google Search', function () {

    it('performs as expected', function (done) {
      var searchBox;
      var browser = this.browser;
      async.waterfall([
        function(cb) {
          browser.get('http://google.com', cb);
        },
        function(cb) {
          browser.elementByName('q', cb);
        },
        function(el, cb) {
          searchBox = el;
          searchBox.type('webdriver', cb);
        },
        function(cb) {
          searchBox.getAttribute('value', cb);
        },
        function(val, cb) {
          try {
            assert.equal(val, 'webdriver');
            cb();
          } catch(e) {
            cb(e);
          }
        }
      ], done);
    });
  });
});
