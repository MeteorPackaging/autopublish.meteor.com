'use strict';
/* global githubRepoList:false, githubOrgList:false */

// Reactively Links org list and repo list
Tracker.autorun(function () {
  var
    activeOrg = githubOrgList.getActiveOrg(),
    orgName = activeOrg && activeOrg.name
  ;
  
  githubRepoList.setSelectedOrg(orgName);
});
