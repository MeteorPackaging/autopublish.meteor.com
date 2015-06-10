/* global
    GithubApi: false,
    Subscriptions: false,
    subscriptionsUtils: false,
    Roles: false
*/


Meteor.methods({
  toggleApproveSubscription: function(repoInfo){
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
        sub = subscriptionsUtils.get(repoInfo),
        user = Meteor.users.findOne(this.userId)
      ;

      if (sub) {
        isApproved = !sub.approved;

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

        Subscriptions.update(sub._id, {$set: newAttrs});

      } else {
        errs.push('subscription does not exists!');
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
  removeSubscription: function(repoInfo){
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
        sub = subscriptionsUtils.get(repoInfo),
        user = Meteor.users.findOne(this.userId)
      ;

      if (sub) {
        var newAttrs = {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: user.profile.login,
        };
        Subscriptions.update(sub._id, {$set: newAttrs});
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
