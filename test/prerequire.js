var assert = require('assert');

describe('When a function is passed as a `prerequire` option', function () {

  it('calls the function with the mocha runner context', function () {
    assert.equal(foo, 'bar');
  });

});
