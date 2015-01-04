'use strict';
/* global github: false, Async: false, Buffer: false, Subscriptions: false */


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

//var hookUrl = 'http://autopublish.meteor.com/publish';
var hookUrl = 'http://2b233d0d.ngrok.com/publish';

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
      ret.summary = obj.summary;
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
  getRepoDetails: function(repoInfo) {
    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    var
      user = Meteor.users.findOne(this.userId),
      ghs = user && user.services && user.services.github,
      token = ghs && ghs.accessToken;

    // Full name must be in the form 'user/repoName' or 'org/repoName'
    // Splits user and repo name
    var
      repoFullName = repoInfo.fullName.split('/'),
      repoId = repoInfo.id,
      gitUrl = repoInfo.gitUrl
    ;
    console.log("getRepoDetails " + repoFullName);

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
        pkg.summary = '';
        pkg.warnings = ['We were unable to parse your package.js file!'];
      }
      finally {

        console.log("Checking hooks...");
        // Gets the list of hooks for the requested repository
        var getHooks = Async.runSync(function(done) {
          github.repos.getHooks({
            user: repoFullName[0],
            repo: repoFullName[1],
          }, function(err, data) {
            done(null, data);
          });
        });
        if (getHooks.result) {
          // Checks whether there's already (at least) one hook pointing to
          // 'https://autopublish.meteor.com/publish'
          var hooks = _
          .chain(getHooks.result)
          .filter(function(hook){
            if (hook.name === 'web' && hook.config) {
              return hook.config.url === hookUrl;
            }
          })
          .value();
          console.log("Hooks details:");
          console.dir(hooks);

          if (hooks.length > 0){
            console.log("...hook found!");
            pkg.hookId = hooks[0].id;
            pkg.enabled = true;

            // Updates the Subscription document
            Subscriptions.update({
              user: repoFullName[0],
              repo: repoFullName[1],
              repoId: repoId,
            }, {$set: {
              user: repoFullName[0],
              repo: repoFullName[1],
              repoId: repoId,
              hookId: hooks[0].id,
              hookEvents: hooks[0].events,
              pkgName: pkg.name,
              pkgVersion: pkg.version,
              pkgSummary: pkg.summary,
              gitUrl: gitUrl,
            }}, {
              upsert: true
            });
            console.log("Subscription created!");
          }
          else {
            // Possibly removes old subscriptions
            Subscriptions.remove({
              user: repoFullName[0],
              repo: repoFullName[1],
              repoId: repoId,
            });
            console.log("Subscription removed!");
          }
        }

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
  toggleRepo: function(repoInfo){
    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    var
      user = Meteor.users.findOne(this.userId),
      ghs = user && user.services && user.services.github,
      token = ghs && ghs.accessToken
    ;

    // Full name must be in the form 'user/repoName' or 'org/repoName'
    // Splits user and repo name
    var
      repoFullName = repoInfo.fullName.split('/'),
      repoId = repoInfo.id,
      gitUrl = repoInfo.gitUrl,
      pkgName = repoInfo.pkgName,
      pkgVersion = repoInfo.pkgVersion,
      pkgSummary = repoInfo.pkgSummary
    ;
    console.log("toggleRepo " + repoFullName);

    if (token) {
      github.authenticate({
        type: "oauth",
        token: token
      });
    }

    // Array of possible errors to appear during toggle operations
    var errs = [];
    // Result object to return
    var ret = {};

    // Gets the list of hooks for the requested repository
    var get = Async.runSync(function(done) {
      github.repos.getHooks({
        user: repoFullName[0],
        repo: repoFullName[1],
      }, function(err, data) {
        done(null, data);
      });
    });
    if (get.result) {
      // Checks whether there's already (at least) one hook pointing to
      // 'https://autopublish.meteor.com/publish'
      var hooks = _
        .chain(get.result)
        .filter(function(hook){
          if (hook.name === 'web' && hook.config) {
            return hook.config.url === hookUrl;
          }
        })
        .value();
      console.log("Hooks details:");
      console.dir(hooks);

      if (hooks.length > 0){
        // In case there is at least one...
        // ...deletes 'all' existing hooks
        _.each(hooks, function(hook){
          console.log("Deleting hook " + hook.id);
          var d = Async.runSync(function(done) {
            github.repos.deleteHook({
              user: repoFullName[0],
              repo: repoFullName[1],
              id: hook.id,
            }, function(err, data) {
              done(null, data);
            });
          });
          if (!d.result){
            errs.push(d.err);
          }
        });

        // Possibly removes old subscriptions
        Subscriptions.remove({
          user: repoFullName[0],
          repo: repoFullName[1],
          repoId: repoId,
        });
        console.log("Subscription deleted!");

        ret.enabled = false;
      }
      else {
        // Otherwise creates a new hook
        var d = Async.runSync(function(done) {
          github.repos.createHook({
            user: repoFullName[0],
            repo: repoFullName[1],
            name: 'web',
            config: {
              url: hookUrl,
              content_type: "json",
            },
            events: ["release"],
            active: true,
          }, function(err, data) {
            done(null, data);
          });
        });
        if (!d.result){
          errs.push(d.err);
        }
        else{
          console.log("Hook created!");
          console.dir(d.result);
          ret.hookId = d.result.id;
          ret.enabled = true;

          // Adds the Subscription document
          Subscriptions.update({
            user: repoFullName[0],
            repo: repoFullName[1],
            repoId: repoId,
          }, {$set: {
            user: repoFullName[0],
            repo: repoFullName[1],
            repoId: repoId,
            hookId: d.result.id,
            hookEvents: d.result.events,
            pkgName: pkgName,
            pkgVersion: pkgVersion,
            pkgSummary: pkgSummary,
            gitUrl: gitUrl,
          }}, {
            upsert: true
          });
          console.log("Subscription created!");
        }
      }
    }

    // Possibly adds errors to the resutl object
    if (errs.length > 0) {
      ret.errs = errs;
    }
    return ret;
  }
});
