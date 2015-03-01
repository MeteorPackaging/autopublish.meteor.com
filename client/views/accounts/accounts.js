'use strict';
/* global githubRepoList: false, githubOrgList: false */

// Reactively Links org list and repo list
Tracker.autorun(function () {
  githubRepoList.setSelectedOrg(githubOrgList.getActiveOrg());
});

githubRepoList.floatTmpl = 'repoInfo';
