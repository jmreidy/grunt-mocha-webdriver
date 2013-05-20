https://secure.travis-ci.org/jmreidy/grunt-mocha-webdriver.png

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
This plugin requires Grunt `>=0.4.0`.

Install the plugin with:

```shell
npm install grunt-browserify --save-dev
```

Then add this line to your project's Gruntfile:
```shell
grunt.loadNpmTasks('grunt-mocha-webdriver');
```

###Using grunt-mocha-webdriver with Phantomjs
If you want to use this plugin to test against PhantomJS, you'll
need to make sure Phantom is installed correctly.

1. Install PhantomJS >= 1.8
If you're on a Mac, Homebrew makes this easy. Just
```shell
brew install phantomjs
```

2. Run PhantomJS with WebDriver support, specifying 4444 as the port.
```shell
phantomjs --webdriver=4444
```

3. Add the `usePhantom` flag in the Grunt option specified below.

##Documentation
Run this task with the `mochaWebdriver` grunt command. For this plugin, the Grunt
`src` property will specify which test files should be run with Mocha in
the `mochaWebdriver` multitask. These tests should be structured as normal
Mocha tests, but should use `this.browser` to refer to a WebDriver browser
which will be injected into the test's context. The browser can be driven
with the API specified in [WD.js](https://github.com/admc/wd). Currently,
only the callback-based version of the API is supported, although the Promise
style will be added shortly.

Please look at this project's Gruntfile and tests to see it in action.

###Options
In addition the the usual Mocha options, the following options are supported:

####usePhantom
Type: Boolean

Specifies whether the task should test against a PhantomJS instance instead
of Sauce Labs. Defaults to false. If true, the tests will run against Phantom
INSTEAD of running against Sauce Labs.

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

##License
Copyright (c) 2013 Justin Reidy

Licensed under the MIT license.
