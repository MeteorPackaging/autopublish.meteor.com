/* global
	Async: false,
  Buffer: false,
	repoUtils: true
*/
'use strict';


repoUtils = {
  createHook: function(github, repoInfo, errors) {
    var
      hook = null,
      hookReq = null,
  		hookUrl = Meteor.settings.hookUrl,
      // Full name must be in the form 'user/repoName' or 'org/repoName'
      // Splits user and repo name
      repoFullName = repoInfo.fullName.split('/')
    ;

    hookReq = Async.runSync(function(done) {
      github.repos.createHook({
        user: repoFullName[0],
        repo: repoFullName[1],
        name: 'web',
        config: {
          url: hookUrl,
          content_type: "json",
        },
        // XXX: TODO: It seems that with both "create" and "release"
        //            we get two triggers...
        //            Options needed to select which one to listen to!
        //events: ["create", "release"],
        events: ["release"],
        active: true,
      }, function(err, data) {
        done(null, data);
      });
    });
    if (!!hookReq.result){
      hook = hookReq.result;
    }
    else {
      errors.push(hookReq.err);
    }
    return hook;
  },

  getAutopublishJSON: function(github, repoInfo, errors) {
    var
      ajReq = null,
      autopublishJSON = null,
      // Full name must be in the form 'user/repoName' or 'org/repoName'
      // Splits user and repo name
      repoFullName = repoInfo.fullName.split('/')
    ;

    ajReq = Async.runSync(function(done) {
      github.repos.getContent({
        user: repoFullName[0],
        repo: repoFullName[1],
        path: 'autopublish.json',
      }, function(err, data) {
        done(null, data);
      });
    });
    if (ajReq.result) {
      try {
        autopublishJSON = new Buffer(ajReq.result.content, 'base64');
        autopublishJSON = autopublishJSON.toString('utf8');
        autopublishJSON = JSON.parse(autopublishJSON);
      }
      catch(err) {
        autopublishJSON = null;
        errors.push('Some problem occured while reading autopublish.json!');
      }
    }

    return autopublishJSON;
  },

  getHooks: function(github, repoInfo, errors) {
    var
      hooks = null,
      hooksReq = null,
			hookTest = Meteor.settings.hookTest,
      // Full name must be in the form 'user/repoName' or 'org/repoName'
      // Splits user and repo name
      repoFullName = repoInfo.fullName.split('/')
    ;

    // Get the list of hooks for the requested repository
    hooksReq = Async.runSync(function(done) {
      github.repos.getHooks({
        user: repoFullName[0],
        repo: repoFullName[1],
      }, function(err, data) {
        done(null, data);
      });
    });
    if (hooksReq.result) {
      // Filter hook to keep only those pointing to autopublish.meteor.com
      var testRe = new RegExp(hookTest);
      try {
        hooks = _.chain(hooksReq.result)
          .filter(function(hook){
            if (hook.name === 'web' && hook.config) {
              return testRe.test(hook.config.url);
            }
          })
          .value();
      }
      catch(err) {
        hooks = null;
        errors.push('Some problem occured while reading webhooks!');
      }
      // Check there's at least one hook, otherwise set hook to null
      if (hooks && hooks.length === 0) {
        hooks = null;
      }
    }

    return hooks;
  },

  getPackageJS: function(github, repoInfo, errors) {
    var
      packageJS = null,
      pjReq = null,
      // Full name must be in the form 'user/repoName' or 'org/repoName'
      // Splits user and repo name
      repoFullName = repoInfo.fullName.split('/')
    ;

    pjReq = Async.runSync(function(done) {
      github.repos.getContent({
        user: repoFullName[0],
        repo: repoFullName[1],
        path: 'package.js',
      }, function(err, data) {
        done(null, data);
      });
    });
    if (pjReq.result) {
      try {
        packageJS = new Buffer(pjReq.result.content, 'base64');
        packageJS = packageJS.toString('utf8');
        packageJS = readPackageJS(packageJS);
      }
      catch(err) {
        packageJS = null;
        errors.push('Some problem occured while reading package.js!');
      }
    }

    return packageJS;
  },

  removeWebhooks: function(github, repoInfo, hooks, errors) {
    var
      // Full name must be in the form 'user/repoName' or 'org/repoName'
      // Splits user and repo name
      repoFullName = repoInfo.fullName.split('/')
    ;

    // deletes all hooks one by one
    try {
      _.each(hooks, function(hook){
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
          errors.push(d.err);
        }
      });
    }
    catch(err) {
      errors.push('Some problem occured while removing webhooks!');
    }
  },
};




// Read/Parse the package.js file
// This is a simplified version of the original one from @raix
// https://raw.githubusercontent.com/raix/Meteor-mrtbulkrelease/master/mrtbulkrelease.js
var readPackageJS = function(packagejsSource) {

  var empty = function() {};
  var ret = {
    warnings: []
  };

  // Create our own fake Package api
  var PackageApi = function() {

    var describe = function(obj) {
      // Check name
      if (obj.name) {
        if (obj.name !== obj.name.toLowerCase()) {
          // Malformed name...
          ret.warnings.push(
            'Correct malformed name "' +
            obj.name +
            '" into "' +
            obj.name.toLowerCase() +
            '"'
          );
        }
        ret.name = obj.name;
      }
      else {
        ret.warnings.push('No name provided');
      }

      // Check version
      if (!obj.version) {
        ret.warnings.push('Missing version');
      }
      ret.version = obj.version;

      // Check summary
      if (!obj.summary) {
        ret.warnings.push('Missing summary');
      } else {
        if (obj.summary.length > 100) {
          ret.warnings.push(
            'Summary too long: currently ' +
            obj.summary.length +
            ' chars > 100 allowed chars'
          );
        }
      }
      ret.summary = obj.summary;

      // Check git url...
      if (!obj.git) {
        ret.warnings.push('Missing git url');
      } else {
        if (!/.git$/.test(obj.git)) {
          ret.warnings.push('Missing .git in git url');
        }
      }
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
