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


Template.home.helpers({
  queueing: function(){
    // Returns the selector to be used to retrieve queueing publish operations
    return {
      completedAt: { $exists: false }
    };
  },
  completed: function(){
    // Returns the selector to be used to retrieve completed publish operations
    return {
      completedAt: { $exists: true }
    };
  },
});
