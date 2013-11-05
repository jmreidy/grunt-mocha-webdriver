![Travis Status](https://secure.travis-ci.org/jmreidy/grunt-mocha-webdriver.png)

##grunt-mocha-webdriver
A [Grunt](http://gruntjs.com) task that runs Mocha-based functional tests against
a Webdriver-enabled source: specifically, PhantomJS for local testing and Sauce Labs
for comprehensive cross-browser testing. This plugin is a combination of
[mocha-cloud](https://github.com/visionmedia/mocha-cloud) and
[grunt-saucelabs](https://github.com/axemclion/grunt-saucelabs). The former
library doesn't have Grunt integration built in, and is designed for running
tests inside the browser; the latter library can launch a grid of browsers on
Sauce Labs, but doesn't support Mocha.


##Getting Started
This plugin requires Grunt `>=0.4.0`; connecting to Sauce Labs requires java.

Install the plugin with:

```shell
npm install grunt-mocha-webdriver --save-dev
```

Then add this line to your project's Gruntfile:
```shell
grunt.loadNpmTasks('grunt-mocha-webdriver');
```

###Using grunt-mocha-webdriver with Phantomjs
In version 0.9.4 and later, phantom is included via its NPM module. In order
to run tests against phantom, simply add the `usePhantom` flag to the options hash.
The plugin defaults to hitting port 4444, but you can specify your own port via
the `phantomPort` option.

##Documentation
Run this task with the `mochaWebdriver` grunt command. For this plugin, the Grunt
`src` property will specify which test files should be run with Mocha in
the `mochaWebdriver` multitask. These tests should be structured as normal
Mocha tests, but should use `this.browser` to refer to a WebDriver browser
which will be injected into the test's context. The browser can be driven
with the API specified in [WD.js](https://github.com/admc/wd). The default
is to use the callback-enabled version of WD.js, but `usePromises` can be passed
as `true` to switch to the Promise-enabled version.

Please look at this project's Gruntfile and tests to see it in action.

###Options
The usual Mocha options are passed through this task to a new Mocha instance.
Please note that while it's possible to specify the Mocha reporter for
tests running on Phantom, there's only one reporter currently supported
for tests against Sauce Labs. This restriction is in place to handle
concurrent Sauce Labs testing sessions, which could pollute the log.

The following options can be supplied to the task:

####usePhantom
Type: Boolean

Specifies whether the task should test against a PhantomJS instance instead
of Sauce Labs. Defaults to false. If true, the tests will run against Phantom
INSTEAD of running against Sauce Labs.

####phantomPort
Type: Int (Default: 4444)

if testing against PhantomJS with the `usePhantom` flag, specify the port
to test against.

####usePromises
Type: Boolean

Specifies whether to use the Promise chain version of the WD.js API. Defaults to
false (the callback version).

####ignoreSslErrors
Type: Boolean

A passthrough to the Phantom CLI runner to ignore errors with SSL certs.

####require
Type: Array <String>

An array of paths for requiring before running Mocha tests. Useful for
pre-requires that manipulate Mocha's global environment (e.g.g making Sinon
globally available).

####username
Type: String

The Sauce Labs username to use. Defaults to value of env var `SAUCE_USERNAME`.

####key
Type: String

The Sauce Labs API key to use. Defaults to value of env var `SAUCE_ACCESS_KEY`.

####identifier
Type: Number

A Unique identifier for the generated tunnel to Sauce Labs. Will be automatically
generated if not specified. Useful for connected to existing Sauce tunnels.

####concurrency
Type: Int

The number of concurrent browser sessions to spin up on Sauce Labs. Defaults to 1.

####tunnelTimeout
Type: Number

Time to wait before closing all tunnels.

####testName
Type: String

The name of the test, as reported to Sauce Labs.

####testTags
Type: [String]

An array of tags to associate with the test, as reported to Sauce Labs.

####browsers
Type: [Object]

An array of objects specifying which browser options should be passed to Sauce Labs.
Unless a test is run against Phantom (e.g. `usePhantom` is true), this option
*must* be specified. Each browser hash should specify: `browserName`, `platform`,
and `version`.

##Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add
unit tests for any new or changed functionality. Lint and test your code using `grunt`.

##Release History

### v0.9.0
 - Initial release

### v0.9.1
 - Setup Travis for CI
 - Improve SauceLabs test failure handling
 - Test count was off by 1

### v0.9.2
 - Update docs
 - Add initial promise support (Phantom only)

### v0.9.3
 - Enable Promise support (Phantom and SauceLabs)

### v0.9.4
 - Run phantom from grunt-mocha-webdriver directly

### v0.9.5
 - Implement `require` option for pre-require hook

### v0.9.6
 - PhantomJS integration failed to report the correct status code
 when exiting Grunt after tests failed.

### v0.9.7
 - Prevent errors from causing Phantom to exit early
 - Better error messages via wd.js

### v0.9.8
 - `ignoreSslErrors` option added as a phantom CLI passthrough

### v0.9.9
 - Update wd.js to 0.2.0, and switch to the new `promiseChain` API

### v0.9.10
 - Fix `promiseChain` on Sauce

### v0.9.11
 - Fix #8, async failures were causing grunt exit

### v0.9.12
 - Bump to latst sauce-tunnel

##License
Copyright (c) 2013 Justin Reidy

Licensed under the MIT license.
