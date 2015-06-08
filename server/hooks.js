/* global
    GithubApi: false,
    KnownHooks: false,
    processHookPingEvent: true,
    Roles: false
*/

// Consumes webhook ping events
// See https://developer.github.com/webhooks/#ping-event

processHookPingEvent = function(ping) {
  'use strict';

  var
    hookDoc = _.pick(ping, 'hook_id', 'hook'),
    newHook = false,
    repository = _.pick(ping.repository, 'id', 'name', 'full_name'),
    user = ping.sender && ping.sender.login
  ;

  // Adds repo info to the hook document
  hookDoc.repository = repository;
  hookDoc.repoFullName = repository.full_name;

  // Marks the hook as 'alive'
  hookDoc.alive = true;
  hookDoc.deleted = false;
  hookDoc.lastTested = new Date();
  hookDoc.createdBy = user;

  // console.log('Received Ping Event');
  // console.dir(ping);
  // console.dir(hookDoc);

  // Checks whether the hook is already known
  var hook = KnownHooks.findOne({
    repoFullName: hookDoc.repoFullName,
  });

  if (hook) {
    if (hook.deleted) {
      // mark it as a new hook anyway...
      newHook = true;
      hookDoc.approved = false;
    }
    // already known hook...
    KnownHooks.update(hook._id, {$set: hookDoc});
  }
  else {
    // new hook!
    newHook = true;
    hookDoc.approved = false;
    KnownHooks.insert(hookDoc);
  }

  // Create a new issue comment to discuss its approval
  // in case it was a new hook
  if (newHook) {

    var
      github = new GithubApi({version: "3.0.0"}),
      newHookIssueDetails = _.clone(Meteor.settings.issues.newHook),
      userCredentials = Meteor.settings.defaultGitHubUser
    ;

    // Adds the body for the issue
    newHookIssueDetails.body =
      'Received from [' +
      hookDoc.repoFullName +
      '](https://github.com/' +
      hookDoc.repoFullName +
      ') to be revised!\n\n' +
      '@' + user + ', thank you for testing autopublish: ' +
      'could you explain how you would like to use it?'
    ;

    github.authenticate({
      type: "basic",
      username: userCredentials.userName,
      password: userCredentials.pwd
    });
    github.issues.createComment(newHookIssueDetails);
  }
};


Meteor.methods({
  testHook: function(hookId, repoFullName){
    'use strict';

    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    var
      // Array of possible errors to appear during toggle operations
      errs = [],
      // Result object to return
      ret = {}
    ;

    // Checks the user is an admin
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      var
        github = new GithubApi({version: "3.0.0"}),
        hook = KnownHooks.findOne({"repoFullName": repoFullName})
      ;

      // Checks the requested hook exists
      if (hook) {
        var userCredentials = Meteor.settings.defaultGitHubUser;

        github.authenticate({
          type: "basic",
          username: userCredentials.userName,
          password: userCredentials.pwd
        });

        var name = hook.repoFullName.split('/');
        github.repos.testHook({
          user: name[0],
          repo: name[1],
          id: hook.hook_id
        }, function(err){
          if (err) {
            KnownHooks.update(hook._id, {$set: {alive: false}});
          }
        });
      }
    }
    else {
      errs.push('You need admin right to test a hook!');
    }

    // Possibly adds errors to the result object
    if (errs.length > 0) {
      ret.errs = errs;
    }

    return ret;
  },

  toggleApproveHook: function(hookId, repoFullName){
    'use strict';

    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    var
      // Array of possible errors to appear during toggle operations
      errs = [],
      // Approval status
      isApproved = null,
      // Result object to return
      ret = {}
    ;

    // Checks the user is an admin
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      var
        hook = null,
        user = Meteor.users.findOne(this.userId)
      ;

      // Checks the requested hook exists
      hook = KnownHooks.findOne({
        hook_id: hookId,
        "repoFullName": repoFullName
      });

      if (hook) {
        isApproved = !hook.approved;

        var newAttrs = {
          approved: isApproved,
        };

        if (isApproved) {
          newAttrs.approvedAt = new Date();
          newAttrs.approvedBy = user.profile.login;
        }
        else {
          newAttrs.disapprovedAt = new Date();
          newAttrs.disapprovedBy = user.profile.login;
        }

        KnownHooks.update(hook._id, {$set: newAttrs});

      } else {
        errs.push('Hook ' + hookId + ' does not exists!');
      }
    }
    else {
      errs.push('You need admin right to approve a hook!');
    }

    // Possibly adds errors to the result object
    if (errs.length > 0) {
      ret.errs = errs;
    } else {
      ret.approved = isApproved;
    }
    return ret;
  },
  removeHook: function(repoFullName){
    'use strict';

    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    var
      // Array of possible errors to appear during toggle operations
      errs = [],
      // Result object to return
      ret = {}
    ;

    // Checks the user is an admin
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      // Checks the requested hook exists
      var hook = KnownHooks.findOne({"repoFullName": repoFullName});
      if (hook) {
        KnownHooks.update(hook._id, {$set: {deleted: true}});
      }
    }
    else {
      errs.push('You need admin right to remove a hook!');
    }

    // Possibly adds errors to the result object
    if (errs.length > 0) {
      ret.errs = errs;
    }

    return ret;
  }
});
