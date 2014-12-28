'use strict';
/* global githubRepoList: false, githubOrgList: false */

// Reactively Links org list and repo list
Tracker.autorun(function () {
  var activeOrg = githubOrgList.getActiveOrg();
  if (activeOrg){
    activeOrg = _.pick(activeOrg, ['login', 'type']);
  }

  githubRepoList.setSelectedOrg(activeOrg);
});


githubRepoList.floatTmpl = 'repoInfo';
