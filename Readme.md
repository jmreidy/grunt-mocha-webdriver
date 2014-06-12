# grunt-mocha-webdriver
[![NPM version](https://badge.fury.io/js/grunt-mocha-webdriver.png)](http://badge.fury.io/js/grunt-mocha-webdriver) [![Build Status](https://travis-ci.org/jmreidy/grunt-mocha-webdriver.svg?branch=master)](https://travis-ci.org/jmreidy/grunt-mocha-webdriver) [![david-dm-status-badge](https://david-dm.org/jmreidy/grunt-mocha-webdriver.png)](https://david-dm.org/jmreidy/grunt-mocha-webdriver#info=dependencies&view=table)
 [![david-dm-status-badge](https://david-dm.org/jmreidy/grunt-mocha-webdriver/dev-status.png)](https://david-dm.org/jmreidy/grunt-mocha-webdriver#info=devDependencies&view=table)
> A [Grunt](http://gruntjs.com) task that runs Mocha-based functional tests against
a Webdriver-enabled source: specifically, PhantomJS for local testing and Sauce Labs
for comprehensive cross-browser testing.

This plugin is a combination of [mocha-cloud](https://github.com/visionmedia/mocha-cloud) and
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

###Using grunt-mocha-webdriver with your own Selenium server
 In version 0.9.15 and later, You can run your tests against your own Selenium server instance.
 To do so, use ``hostname`` and ``port`` options.
 Don't forget to remove ``username`` and ``key``.
 Note that the Selenium server should be started and ready before starting the tests.

##Documentation
Run this task with the `mochaWebdriver` grunt command. For this plugin, the Grunt
`src` property will specify which test files should be run with Mocha in
the `mochaWebdriver` multitask. These tests should be structured as normal
Mocha tests, but should use `this.browser` to refer to a WebDriver browser
which will be injected into the test's context. The browser can be driven
with the API specified in [WD.js](https://github.com/admc/wd). The default
is to use the callback-enabled version of WD.js, but `usePromises` can be passed
as `true` to switch to the Promise-enabled version.

As of version `0.2.3` of WD.js, wd [provides the ability](https://github.com/admc/wd#adding-custom-methods)
to add test methods to its default set of capabilities. `grunt-mocha-webdriver`
exposes the `wd` instance in the same way that `browser` is exposed, so that
you can easily add your own test methods to wd.

Also, Mocha options are exposed to tests. This is especially helpful if you want to reuse the
defined Mocha timeout for your Webdriver tests. For example you can do this in your
Webdriver based E2E tests:

```js
this.browser.waitForElementByCss('.aClass', this.mochaOptions.timeout, cb);
```

Please look at this project's Gruntfile and tests to see all that in action.

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

####phantomCapabilities
Type: Object (Default: {})

if testing against PhantomJS with the `usePhantom` flag, specify the
[browser capabilities](https://github.com/detro/ghostdriver#what-extra-webdriver-capabilities-ghostdriver-offers).

####phantomFlags
Type: array (Default: [])

if testing against PhantomJS with the `usePhantom` command-line options, specify start additional flags to use. Check [here](http://phantomjs.org/api/command-line.html) or type `phantomjs -h` for complete list of flags.

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

####secureCommands
Type: Boolean (Default: false)

If true, it will use saucelabs, with default `hostname` set to `127.0.0.1` and `port` set to `4445`
in order to send selenium commands through Sauce Connect tunnel (more info
[here](https://saucelabs.com/docs/connect#selenium-relay)).

####autoInstall
Type: Boolean

If `true` this will download Selenium and Chrome Driver to run tests locally.

####hostname
Type: String

If specified, it will connect that selenium server instead of `ondemand.saucelabs.com`.

####port
Type: Int

Selenium server port. Should be used in conjonction with ``hostname``.

####identifier
Type: Number

A Unique identifier for the generated tunnel to Sauce Labs. Will be automatically
generated if not specified. Useful for connected to existing Sauce tunnels.

####concurrency
Type: Int

The number of concurrent browser sessions to spin up on Sauce Labs. Defaults to 1.

####tunnelFlags
Type: Array
An array of option flags for Sauce Connect. See the list of available options
 [here](https://saucelabs.com/docs/connect#connect-flags).

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
*must* be specified. Each browser hash should specify: `browserName`. For saucelabs tests, `platform`,
and `version` are also required.

##Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add
unit tests for any new or changed functionality. Lint and test your code using `grunt`.

##Release History
See History.md

##Contributors
 - Author: [Justin Reidy](https://github.com/jmreidy)
 - You?

##License
Copyright (c) 2014 Justin Reidy

Licensed under the MIT license.
