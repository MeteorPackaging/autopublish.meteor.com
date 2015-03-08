/* global
    github: false,
    processHookPingEvent: true,
    KnownHooks: false
*/

// Consumes webhook ping events
// See https://developer.github.com/webhooks/#ping-event

processHookPingEvent = function(ping) {
  'use strict';


  var
    hookDoc = _.pick(ping, 'hook_id', 'hook'),
    repository = _.pick(ping.repository, 'id', 'name', 'full_name')
  ;

  // Adds repo info to the hook document
  hookDoc.repository = repository;
  hookDoc.repoFullName = repository.full_name;
  // Marks the hook as 'alive'
  hookDoc.alive = true;
  hookDoc.lastTested = new Date();

	// console.log('Received Ping Event');
	// console.dir(ping);
	// console.dir(hookDoc);

  // Selector for the hook document
  var selector = {
    hook_id: hookDoc.hook_id,
    repoFullName: hookDoc.repoFullName,
  };

  // Checks whether the hook is already known
  var hook = KnownHooks.findOne(selector);

  if (hook) {
    // already known hook...
    KnownHooks.update(hook._id, {$set: hookDoc});
  }
  else {
    // new hook!
    KnownHooks.insert(hookDoc);

    var
      userCredentials = Meteor.settings.defaultGitHubUser,
      newHookIssueDetails = _.clone(Meteor.settings.issues.newHook)
    ;

    // Adds the body for the issue
    newHookIssueDetails.body =
      'Received from [' +
      hookDoc.repoFullName +
      '](https://github.com/' +
      hookDoc.repoFullName +
      '), please revise!'
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

    console.log("testHook");

    // Checks the user is an admin
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      console.log("admin!");
      // Selector for the hook document
      var selector = {
        hook_id: hookId,
        "repoFullName": repoFullName
      };
      console.dir(selector);
      // Checks the requested hook exists
      var hook = KnownHooks.findOne(selector);

      if (hook) {
        console.log("known hook!");

        var userCredentials = Meteor.settings.defaultGitHubUser;

        github.authenticate({
          type: "basic",
          username: userCredentials.userName,
          password: userCredentials.pwd
        });

        var name = hook.repoFullName.split('/');
        console.log("name:");
        console.dir(name);
        console.log("hook_id:");
        console.dir(hook.hook_id);
        github.repos.testHook({
          user: name[0],
          repo: name[1],
          id: hook.hook_id
        }, function(err, result){
          if (err) {
            KnownHooks.update(hook._id, {
              $set: {
                alive: false
              }
            });
          }
        });
      }
    }
  },
  toggleApproveHook: function(hookId, repoFullName){
    'use strict';

    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    var
      // Array of possible errors to appear during toggle operations
      errs = [],
      // Result object to return
      ret = {},
      // Approval status
      approved
    ;

    // Checks the user is an admin
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      // Selector for the hook document
      var selector = {
        hook_id: hookId,
        "repoFullName": repoFullName
      };
      // Checks the requested hook exists
      var hook = KnownHooks.findOne(selector);

      if (hook) {
        approved = !hook.approved;
        KnownHooks.update(hook._id, {
          $set: {
            "approved": approved
          }
        });
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
      ret.approved = approved;
    }
    return ret;
  },
  removeHook: function(hookId, repoFullName){
    'use strict';

    // Since this is not a blocking method, tells the next method calls can
    // start in a new fiber without waiting this one to complete
    this.unblock();

    // Checks the user is an admin
    if (Roles.userIsInRole(this.userId, ['admin'])) {
      // Selector for the hook document
      var selector = {
        hook_id: hookId,
        "repoFullName": repoFullName
      };
      // Checks the requested hook exists
      var hook = KnownHooks.findOne(selector);

      if (hook) {
        KnownHooks.update(hook._id, {
          $set: {
            deleted: true
          }
        });
      }
    }
  }
});
