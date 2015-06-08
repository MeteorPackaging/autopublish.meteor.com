/* global
  GithubApi: false,
  KnownHooks: false,
  repoUtils: false,
  Roles: false,
  subscriptionsUtils: false,
  wrappersUtils: false
*/
'use strict';


Meteor.methods({
  getRepoDetails: function(repoInfo) {
    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    // Only logged in users can get repo details...
    if (!this.userId) {
      return {errors: ['Please login first...']};
    }

    var
      user = Meteor.users.findOne(this.userId),
      autopublishJSON = null,
      errors = [],
      ghs = user && user.services && user.services.github,
      github = new GithubApi({version: "3.0.0"}),
      hooks = null,
      knownHook = null,
      packageJS = null,
      repoDetails = {},
      // Full name must be in the form 'user/repoName' or 'org/repoName'
      // Splits user and repo name
      repoFullName = repoInfo.fullName.split('/'),
      token = ghs && ghs.accessToken
    ;


    // We have three options here:
    //
    // 1) repository from `MeteorPackaging` with an `autopublish.json` file
    //    this should be a wrapper repository...
    //    ...and could be enabled as a wrapper subscription
    //
    // 2) if not 1) a repository with a `package.js` file
    //    this could be a meteor package...
    //    ...and could be enabled as a regular subscription
    //
    // 3) a repository without any `autopublish.json` or `package.js` file
    //    this repo cannot be auto-published in any way!
    //    ...but a webhook from it could be created to publish other packages...

    // Possibly authenticate the current user
    if (token) {
      github.authenticate({
        type: "oauth",
        token: token
      });
    }

    // Possibly read 'autopublish.json' from the repository's root folder
    if (repoFullName[0] === 'MeteorPackaging') {
      autopublishJSON = repoUtils.getAutopublishJSON(github, repoInfo, errors);
    }

    // Possibly read 'package.js' from the repository's root folder
    packageJS = repoUtils.getPackageJS(github, repoInfo, errors);
    if (packageJS) {
      repoInfo.pkgName = packageJS.name;
      repoInfo.pkgVersion = packageJS.version;
      repoInfo.pkgSummary = packageJS.summary;
    }

    // Get the list of hooks for the requested repository
    hooks = repoUtils.getHooks(github, repoInfo, errors);

    // Check whether there's a KnownHook document for this repo
    knownHook = KnownHooks.findOne({
      repoFullName: repoInfo.fullName,
      deleted: {'$ne': true},
    });

    // Mark corresponding known hook as deleted in case there's
    // no more hooks on the repository
    if (knownHook && !hooks) {
      KnownHooks.update(knownHook._id, {$set: {deleted: true}});
      knownHook = null;
    }

    // Set webhook status
    repoDetails.webhookEnabled = !!knownHook;

    if (autopublishJSON && packageJS) {
      // this repo is a MeteorPackaging wrapper
      repoDetails.pkgInfo = packageJS;
      repoDetails.wrapper = autopublishJSON || {};
      console.log('getRepoDetails');
      console.dir(repoInfo);
      console.dir(autopublishJSON);
      console.dir(packageJS);

      var wrapper = wrappersUtils.get(repoInfo);
      if (wrapper && !wrapper.deleted) {
        repoDetails.wrapper.enabled = true;
      }
      // console.log('Wrapper package: ' + repoFullName[1]);
      // console.dir(repoDetails);
    }
    else if (packageJS) {
      // this repo is a Meteor package
      repoDetails.pkgInfo = packageJS;

      var subscription = subscriptionsUtils.get(repoInfo);
      if (subscription && !subscription.deleted) {
        subscriptionsUtils.upsert(repoInfo, user);
        repoDetails.pkgInfo.enabled = true;
      }
    }
    /*
    else {
      // this repo is a normal repo not directly related with Meteor
    }
    */

    // Possibly attach erros details
    if (errors.length > 0) {
      repoDetails.errors = errors;
    }

    return repoDetails;
  },

  toggleMeteorPackage: function(repoInfo){
    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    // Only logged in users can toggle subscriptions...
    if (!this.userId) {
      return {errors: ['Please login first...']};
    }

    console.log('toggleMeteorPackage');
    console.dir(repoInfo);


    var
      // Array of possible errors to appear during toggle operations
      errors = [],
      // Result object to return
      ret = {},
      subscription = null,
      user = Meteor.users.findOne(this.userId)
    ;

    // If there's already a subscription for this repository
    subscription = subscriptionsUtils.get(repoInfo);
    if (subscription && !subscription.deleted){
      try {
        // Mark the old subscription as deleted
        subscriptionsUtils.delete(repoInfo, user);
        ret.enabled = false;
      }
      catch(err) {
        errors.push('Some error occured while deleting subscription!');
      }
    }
    else {
      // Check whether there's already a corresposnding known hook...
      var knownHook = KnownHooks.findOne({
        repoFullName: repoInfo.fullName,
        deleted: {'$ne': true},
      });
      if (knownHook) {
        try {
          // Creates a new subscription
          subscriptionsUtils.upsert(repoInfo, user);
          ret.enabled = true;
        }
        catch(err) {
          errors.push('Some error occured while creating subscription!');
        }
      }
      else {
        errors.push('No hook found, please create a webhook first!');
      }
    }

    // Possibly adds errors to the resutl object
    if (errors.length > 0) {
      ret.errors = errors;
    }
    return ret;
  },

  toggleWebhook: function(repoInfo, enabled){
    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    // Only logged in users can toggle webhooks...
    if (!this.userId) {
      return {errors: ['Please login first...']};
    }

    var
      // Array of possible errors to appear during toggle operations
      errors = [],
      github = new GithubApi({version: "3.0.0"}),
      hooks = null,
      // Result object to return
      ret = {},
      user = Meteor.users.findOne(this.userId),
      ghs = user && user.services && user.services.github,
      token = ghs && ghs.accessToken
    ;

    if (token) {
      github.authenticate({
        type: "oauth",
        token: token
      });
    }

    // Get the list of hooks for the requested repository
    hooks = repoUtils.getHooks(github, repoInfo, errors);
    // Delete 'all' existing hooks
    if (hooks){
      repoUtils.removeWebhooks(github, repoInfo, hooks, errors);
    }

    if (enabled) {
      var hook = repoUtils.createHook(github, repoInfo, errors);
      if (hook) {
        ret.hookId = hook.id;
        ret.enabled = true;
      }
    }
    else {
      var knownHook = KnownHooks.findOne({
        repoFullName: repoInfo.repoFullName,
        deleted: {'$ne': true},
      });
      if (knownHook) {
        KnownHooks.update(knownHook._id, {$set: {deleted: true}});
      }
      ret.enabled = false;
    }

    // Possibly adds errors to the resutl object
    if (errors.length > 0) {
      ret.errors = errors;
    }
    return ret;
  },

  toggleWrapper: function(repoInfo, enabled){
    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    // Checks the user is an admin
    if (!Roles.userIsInRole(this.userId, ['admin'])) {
      return {errors: ['Only admins can toggle wrapper packages...']};
    }

    console.log('Toggling wrapper');
    console.dir(enabled);
    console.dir(repoInfo);

    var
      // Array of possible errors to appear during toggle operations
      errors = [],
      github = new GithubApi({version: "3.0.0"}),
      // Full name must be in the form 'user/repoName' or 'org/repoName'
      // Splits user and repo name
      repoFullName = repoInfo.fullName.split('/'),
      // Result object to return
      ret = {},
      wrapInfo = null,
      wrapper = null,
      user = Meteor.users.findOne(this.userId)
    ;

    // If there's already a wrapper for this repository
    wrapper = wrappersUtils.get(repoInfo);

    if (enabled) {
      // Possibly read 'autopublish.json' from the repository's root folder
      if (repoFullName[0] === 'MeteorPackaging') {
        wrapInfo = repoUtils.getAutopublishJSON(github, repoInfo, errors);

        try {
          // Creates a new wrapper
          wrappersUtils.upsert(repoInfo, wrapInfo, user);
          ret.enabled = true;
        }
        catch(err) {
          errors.push('Some error occured while creating wrapper!');
        }
      }
      else {
        errors.push('Only wrapper repositories under MeteorPackaging allowed!');
      }
    }
    else {
      if (wrapper){
        try {
          // Mark the old wrapper as deleted
          wrappersUtils.delete(repoInfo, user);
          ret.enabled = false;
        }
        catch(err) {
          errors.push('Some error occured while deleting wrapper!');
        }
      }
    }

    // Possibly adds errors to the resutl object
    if (errors.length > 0) {
      ret.errors = errors;
    }
    return ret;
  },

});
