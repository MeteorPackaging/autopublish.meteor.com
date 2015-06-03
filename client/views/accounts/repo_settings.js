/* global
  Roles: false
*/
'use strict';


Template.repoSettings.helpers({
  wrapper: function(){
    var
      adminUser = Roles.userIsInRole(Meteor.userId(), ['admin']),
      repoDetails = this.repoDetails
    ;
    if (adminUser && !!repoDetails && !!repoDetails.wrapper) {
      console.dir(this.repoDetails);
    }
    return adminUser && !!repoDetails && !!repoDetails.wrapper;
  },
  meteorPackage: function(){
    var repoDetails = this.repoDetails;
    return !!repoDetails && !!repoDetails.pkgInfo && !repoDetails.wrapper;
  },
  webhook: function(){
    var repoDetails = this.repoDetails;
    return !!repoDetails && !(!!repoDetails.wrapper && !!repoDetails.pkgInfo);
  }
});
