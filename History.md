### v1.1.2
-  Update dependencies

### v1.1.1
 - Fix `opts.autoInstall` behavior (@ChrisWren)

### v1.1.0
 - Moved changelog to History.md (@binarykitchen)
 - Added autoinstall options to automatically install chromedriver and selenium (@ChrisWren)
 - Fixes and cleanup (@ChrisWren)
 - Updated dependencies (@ChrisWren, @binarykitchen);

### v1.0.6
 - Report pass/fail status to Sauce Labs (@ChrisWren)

### v1.0.5
 - Check if phantom is closed before killing it (#68) (@binarykitchen)

### v1.0.4
 - Shortened Sauce URL for copyability (#62) (@ChrisWren)
 - Fixed Sauce Labs spelling and added error message (#63) (@ChrisWren)
 - Add support for "build" tagging (#64) (@ChrisWren)

### v1.0.3
 - Make PhantomJS process interruptable (@shawnzhu)
 - Correctly report exit code failure for test error (@shawnzhu)

### v1.0.2
 - Add phantomJS flags (@saadtazi)

### v1.0.1
 - Improve Sauce test logging

### v1.0.0
 - Move to latest version of sauce tunnel / sauce connect
 - Added ability to specify phantomjs capabilities (@saadtazi)
 - Added secure commands for selenium (@saadtazi)

### v0.9.16
 - `tunnelFlags` options, courtesy of @saadtazi

### v0.9.15
 - Add Selenium support (thanks to @saadtazi)

### v0.9.14
 - Bump to 1.15.1 of Mocha, and expose mocha options to tests

### v0.9.13
 - Bump to 0.2.3 of WD, and expose the wd instance to tests

### v0.9.12
 - Bump to latst sauce-tunnel

### v0.9.11
 - Fix #8, async failures were causing grunt exit

### v0.9.10
 - Fix `promiseChain` on Sauce

### v0.9.9
 - Update wd.js to 0.2.0, and switch to the new `promiseChain` API

### v0.9.8
 - `ignoreSslErrors` option added as a phantom CLI passthrough

### v0.9.7
 - Prevent errors from causing Phantom to exit early
 - Better error messages via wd.js

### v0.9.6
 - PhantomJS integration failed to report the correct status code
 when exiting Grunt after tests failed.

### v0.9.5
 - Implement `require` option for pre-require hook

### v0.9.4
 - Run phantom from grunt-mocha-webdriver directly

### v0.9.3
 - Enable Promise support (Phantom and SauceLabs)

### v0.9.2
 - Update docs
 - Add initial promise support (Phantom only)

### v0.9.1
 - Setup Travis for CI
 - Improve SauceLabs test failure handling
 - Test count was off by 1

### v0.9.0
 - Initial release
