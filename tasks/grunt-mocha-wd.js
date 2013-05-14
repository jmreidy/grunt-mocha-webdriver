'use strict';

var wd = require('wd');
var request = require('request').defaults({jar:false});
var Mocha = require('mocha');
var path = require('path');
var proc = require('child_process');

/*
 * grunt-mocha-sauce
 * https://github.com/jmreidy/grunt-mocha-sauce
 *
 * Copyright (c) 2013 Justin Reidy
 * Licensed under the MIT license
 */

module.exports = function (grunt) {
  grunt.registerMultiTask('mochaWD', 'Run mocha tests against PhantomJS and SauceLabs', function () {

    var opts = this.options({
      username: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
      identifier: Math.floor((new Date()).getTime() / 1000 - 1230768000).toString(),
      tunneled: true,
      testTimeout: (1000 * 60 * 5),
      tunnelTimeout: 120,
      testInterval: 1000 * 5,
      testReadyTimeout: 1000 * 5,
      testname: "",
      tags: [],
      browsers: [{}]
    });

    grunt.util.async.forEachSeries(this.files, function (fileGroup, next) {
      var tunnel = new SauceTunnel(opts.username, opts.key, opts.identitied, opts.tunneled, opts.tunnelTimeout);
      grunt.log.writeln("=> Connecting to Saucelabs ...");
      tunnel.start(function(isCreated) {
        if (!isCreated) return next(false);
        grunt.log.ok("Connected to Saucelabs.");
        var browser = wd.remote();


        browser.init({}, function () {
          runTestsForBrowser(opts, fileGroup, browser, tunnel, next);
        });
      });
    }, this.async());
  });


  function runTestsForBrowser(opts, fileGroup, browser, tunnel, next) {
    var mocha = new Mocha(opts);
    var onTestFinish = function(err) {
      browser.quit();
      if (tunnel) {
        tunnel.stop(function () {
          next(err);
        });
      }
      else {
        next(err);
      }
    };

    mocha.suite.on('pre-require', function (context, file, m) {
      context.browser = browser;
    });

    grunt.file.expand({filter: 'isFile'}, fileGroup.src).forEach(function (f) {
      mocha.addFile(path.resolve(f));
    });

    try {
      mocha.run(function(errCount) {
        onTestFinish(errCount === 0);
      });
    } catch (e) {
      grunt.log.error("Mocha failed to run");
      grunt.log.error(e.stack);
      onTestFinish(false);
    }
  }

  function SauceTunnel(user, key, identifier, tunneled, tunnelTimeout) {
    this.user = user;
    this.key = key;
    this.identifier = identifier;
    this.tunneled = tunneled;
    this.tunnelTimeout = tunnelTimeout;
    this.baseUrl = ["https://", this.user, ':', this.key, '@saucelabs.com', '/rest/v1/', this.user].join("");
  };

  SauceTunnel.prototype.openTunnel = function(callback) {
    var args = ["-jar", __dirname + "/Sauce-Connect.jar", this.user, this.key, "-i", this.identifier];
    this.proc = proc.spawn('java', args);
    var calledBack = false;

    this.proc.stdout.on('data', function(d) {
      var data = typeof d !== 'undefined' ? d.toString() : '';
      if (typeof data === 'string' && !data.match(/^\[-u,/g)) {
        grunt.verbose.debug(data.replace(/[\n\r]/g, ''));
      }
      if (typeof data === 'string' && data.match(/Connected\! You may start your tests/)) {
        grunt.verbose.ok('=> Sauce Labs Tunnel established');
        if (!calledBack) {
          calledBack = true;
          callback(true);
        }
      }
    });

    this.proc.stderr.on('data', function(data) {
      grunt.log.error(data.toString().replace(/[\n\r]/g, ''));
    });

    this.proc.on('exit', function(code) {
      grunt.verbose.ok('Sauce Labs Tunnel disconnected ', code);
      if (!calledBack) {
        calledBack = true;
        callback(false);
      }
    });
  };

  SauceTunnel.prototype.getTunnels = function(callback) {
    request({
      url: this.baseUrl + '/tunnels',
      json: true
    }, function(err, resp, body) {
      callback(body);
    });
  };

  SauceTunnel.prototype.killAllTunnels = function(callback) {
    if (!this.tunneled) {
      return callback();
    }
    var me = this;
    grunt.verbose.debug("Trying to kill all tunnels");
    this.getTunnels(function(tunnels) {
      (function killTunnel(i) {
        if (i >= tunnels.length) {
          setTimeout(callback, 1000 * 5);
          return;
        }
        grunt.log.writeln("=> Killing tunnel %s", tunnels[i]);
        request({
          method: "DELETE",
          url: me.baseUrl + "/tunnels/" + tunnels[i],
          json: true
        }, function() {
          killTunnel(i + 1);
        });
      }(0));
    });
  };

  SauceTunnel.prototype.start = function(callback) {
    var me = this;
    if (!this.tunneled) {
      return callback(true);
    }
    this.getTunnels(function(tunnels) {
      if (!tunnels) {
        grunt.verbose.error("=> Could not get tunnels for Sauce Labs. Still continuing to try connecting to Sauce Labs".inverse);
      }
      if (tunnels && tunnels.length > 0) {
        grunt.log.writeln("=> Looks like there are existing tunnels to Sauce Labs, need to kill them. TunnelID:%s", tunnels);
        (function waitForTunnelsToDie(retryCount) {
          if (retryCount > 5) {
            grunt.verbose.writeln("=> Waited for %s retries, now trying to shut down all tunnels and try again", retryCount);
            me.killAllTunnels(function() {
              me.start(callback);
            });
          } else {
            grunt.verbose.debug("=> %s. Sauce Labs tunnels already exist, will try to connect again %s milliseconds.", retryCount, me.tunnelTimeout / 5);
            setTimeout(function() {
              waitForTunnelsToDie(retryCount + 1);
            }, me.tunnelTimeout / 5);
          }
        }(0));
      } else {
        grunt.verbose.writeln("=> Sauce Labs trying to open tunnel".inverse);
        me.openTunnel(function(status) {
          callback(status);
        });
      }
    });
  };

  SauceTunnel.prototype.stop = function(callback) {
    if (this.proc) {
      this.proc.kill();
    }
    this.killAllTunnels(function() {
      callback();
    });
  };
};
