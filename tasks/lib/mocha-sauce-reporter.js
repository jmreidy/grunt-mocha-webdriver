var BaseReporter = require('mocha').reporters.Base;
var color = BaseReporter.color;

module.exports = function (browser) {

  var SauceReporter = function(runner) {
    BaseReporter.call(this, runner);

    var self = this;
    var stats = this.stats;
    var numberTests = 0;
    var passes = 0;
    var failures = 0;
    var failInfo = {};
    var i;

    runner.on('test end', function () {
      numberTests++;
    });

    runner.on('pass', function () { passes++; });
    runner.on('fail', function (e) {
      failures++;
      failInfo[runner.suite.title] = failInfo[runner.suite.title] || [];
      failInfo[runner.suite.title].push(
        e.title + 
        (e.err.message ? (': ' + e.err.message) : '') + 
        (e.err.stack ? e.err.stack : '')
	  );      
    });

    runner.on('end', function(){
      console.log();
      console.log('Tests complete for ' + browser.browserTitle);
      console.log(color('bright pass', '%d %s'), numberTests, 'tests run.');
      if (passes) {
        console.log(color('green', '%d %s'), passes, 'tests passed.');
      }
      if (failures) {
        console.log(color('fail', '%d %s'), failures, 'tests failed.');
        for(var i in failInfo) {
          console.log(color('fail', i + '\n\t' + failInfo[i].join('\n\t')));
        }
      }
      if (browser.mode === 'saucelabs') {
        console.log('Test video at: http://saucelabs.com/tests/' + browser.sessionID);
      }
      console.log();
    });
  };

  SauceReporter.prototype.__proto__ = BaseReporter.prototype;

  return SauceReporter;
};
