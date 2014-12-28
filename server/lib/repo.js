'use strict';
/* global github: false, Async: false, Buffer: false */


/*
GitHub API Resources:

https://developer.github.com/v3/repos/hooks/
https://github.com/mikedeboer/node-github
http://mikedeboer.github.io/node-github/

- Hooks

http://mikedeboer.github.io/node-github/#repos.prototype.getHook
http://mikedeboer.github.io/node-github/#repos.prototype.getHooks
http://mikedeboer.github.io/node-github/#repos.prototype.createHook
https://developer.github.com/v3/repos/hooks/#create-a-hook
*/

// Read the package.js file
// This is a simplified version of the original one from @raix
// https://raw.githubusercontent.com/raix/Meteor-mrtbulkrelease/master/mrtbulkrelease.js
var readPackagejs = function(packagejsSource) {

  var empty = function() {};
  var ret = {
    warnings: []
  };

  // Create our own fake Package api
  var PackageApi = function() {

    var describe = function(obj) {
      if (obj.name) {
        ret.name = obj.name;
      }
      else {
        ret.warnings.push('No name provided');
      }
      ret.version = obj.version;
      //ret.summary = obj.summary;
    };

    var addF = 0;
    var add_files = function() {
      if (!addF++) {
        ret.warnings.push('Use "addFiles" instead of "add_files"');
      }
    };

    var onUse = function(f) {
      f({
        use: empty,
        imply: empty,
        add_files: add_files,
        addFiles: empty,
        versionsFrom: empty,
        export: empty
      });
    };

    var onU = 0;
    var on_use = function(f) {
      if (!onU++) {
        ret.warnings.push('Use "onUse" instead of "on_use"');
      }
      onUse(f);
    };

    var onT = 0;
    var on_test = function(f) {
      if (!onT++) {
        ret.warnings.push('Use "onTest" instead of "on_test"');
      }
    };

    var regP = 0;
    var _register_plugin = function() {
      if (!regP++) {
        ret.warnings.push(
          'Use "registerBuildPlugin" instead of' +
          ' "_transitional_registerBuildPlugin"'
        );
      }
    };

    return {
      describe: describe,
      on_test: on_test,
      onTest: empty,
      on_use: on_use,
      onUse: onUse,
      registerBuildPlugin: empty,
      _transitional_registerBuildPlugin: _register_plugin
    };
  };

  // Create an empty Npm api
  var NpmApi = {
    depends: empty,
    require: empty
  };

  var CordovaApi = {
    depends: empty,
    require: empty
  };

  var reader = new Function(
    'return function (Package, Npm, Cordova) {\n' +
      // body will be the package.js file
      packagejsSource +
    '\n};'
  )();
  // Run the thing
  reader(PackageApi(), NpmApi, CordovaApi);

  // Possibly removes empty warning list
  if (ret.warnings.length === 0) {
    delete ret.warnings;
  }

  // Return the result
  return ret;
};


Meteor.methods({
  getRepoDetails: function(repoFullName) {
    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    console.log("getRepoDetails " + repoFullName);

    var
      user = Meteor.users.findOne(this.userId),
      ghs = user && user.services && user.services.github,
      token = ghs && ghs.accessToken;

    // Full name must be in the form 'user/repoName' or 'org/repoName'
    // Splits user and repo name
    repoFullName = repoFullName.split('/');

    if (token) {
      github.authenticate({
        type: "oauth",
        token: token
      });
    }

    var get = Async.runSync(function(done) {
      github.repos.getContent({
        user: repoFullName[0],
        repo: repoFullName[1],
        path: 'package.js',
      }, function(err, data) {
        done(null, data);
      });
    });
    if (get.result) {
      var content = new Buffer(get.result.content, 'base64').toString('utf8');
      var pkg = {};
      try {
        pkg = readPackagejs(content);
      }
      catch(err) {
        pkg.name = 'Probably a Meteor Package';
        pkg.version = '';
        pkg.warnings = ['We were unable to parse your package.js file!'];
      }
      finally {
        if (pkg.name) {
          console.log("Package " + pkg.name);
        }
        console.dir(pkg);
        return pkg;
      }
    } else {
      throw new Meteor.Error("Not a meteor package!");
    }
  },
  toggleRepo: function(){
    var sleep = function(time) {
      var stop = new Date().getTime() + time;
      while(new Date().getTime() < stop) {
        ;
      }
    };
    sleep(500);
  }
});
