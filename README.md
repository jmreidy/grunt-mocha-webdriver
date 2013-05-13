##Rationale
`grunt-mocha-webdriver` is a combination of [mocha-cloud](https://github.com/visionmedia/mocha-cloud) and [grunt-saucelabs](https://github.com/axemclion/grunt-saucelabs).
The former library doesn't have Grunt integration built in, and is designed for running tests inside the browser; the latter library can launch a grid of browsers on SauceLabs,
but doesn't support Mocha.

This library is designed for launching server-side mocha tests against either a local PhantomJS instance,
or a Selenium grid service like SauceLabs.

##Using grunt-mocha-sauce with Phantomjs

1. Install phantomjs >= 1.8
Homebrew makes this easy. brew install phantomjs

2. Run PhantomJS with WebDriver support
phantomjs --webdriver=<port>
