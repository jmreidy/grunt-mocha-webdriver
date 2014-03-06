/*global globalVar:false*/

var assert = require('assert');

describe('A Mocha test run by grunt-mocha-webdriver', function () {

  it('can reference globals provided in a pre-require', function () {
    assert.ok(globalVar);
  });

});
