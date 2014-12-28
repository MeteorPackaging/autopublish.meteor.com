'use strict';
/* global githubRepoList: true */

/**
* githubRepoList module
* provides both a 'githubRepoList' template to list a GitHub user's repositories
* and a 'githubRepoList' object reactively providing the status of the template
* @exports githubRepoList
* @version 1.0
*/

/**
* githubRepoList @class
* @constructor
*/
var ghRL = function(){};

/**
* Reactive object referencing the currently selected repository item.
* @private @var
*/
ghRL.prototype._activeRepo = new ReactiveVar();

/**
* Reactive object referencing the organization currently selected as
* source for repositories.
* @private @var
*/
ghRL.prototype._selectedOrg = new ReactiveVar();

/**
* Array of rendered template instances.
* @private @var
*/
ghRL.prototype._instances = [];

/**
* Clears the active repository.
* @method
*/
ghRL.prototype.clearActiveRepo = function(){
  return this._activeRepo.set(undefined);
};

/**
* Clears the selected organization.
* @method
*/
ghRL.prototype.clearSelectedOrg = function(){
  return this._selectedOrg.set(undefined);
};

/**
* Name for the template to be possibly put as a right float
* on each repository item
* @var
*/
ghRL.prototype.floatTmpl = null;

/**
* Retrieves the active repository.
* @method
*/
ghRL.prototype.getActiveRepo = function(){
  return this._activeRepo.get();
};

/**
* Retrieves the selected organization.
* @method
*/
ghRL.prototype.getSelectedOrg = function(){
  return this._selectedOrg.get();
};

/**
* Retrieves the list of rendered template instances.
* @method
*/
ghRL.prototype.instances = function(){
  return this._instances;
};

/**
* Sets the active repository.
* @method
* @param {number} repoId - The id of the repository to be set as the active one.
* Returns true in case of successful active repository update.
*/
ghRL.prototype.setActiveRepo = function(repoId){
  check(repoId, Number);
  // Checks if a repository with _id *repoId* exists
  if (ghRepos.findOne({_id: repoId})) {
    var activeRepo = this._activeRepo.get();

    // Checks it is not already the current one
    // to prevent useless reactive re-computations
    if (!activeRepo || activeRepo._id !== repoId) {
      // Sets it as the active one
      this._activeRepo.set(repoId);
    }

    return true;
  }

  // Clears the active repository, , in case the provided id is invalid
  this._activeRepo.set(undefined);
  return false;
};

/**
* Sets the selected organization.
* @method
* @param {object} orgObj - The organization to be set as the current source
*                          for repositories.
* Returns true in case of successful selected organization update.
*/
ghRL.prototype.setSelectedOrg = function(orgObj){
  if (!orgObj){
    this._selectedOrg.set(undefined);
    return true;
  }
  check(orgObj, Object);

  var selectedOrg = this._selectedOrg.get();

  // Checks it is not already the current one
  // to prevent useless reactive re-computations
  if (!selectedOrg || selectedOrg._id !== orgObj._id) {
    // Sets it as the selected one
    this._selectedOrg.set(orgObj);
  }
  return true;
};

// Instantiation of the githubRepoList which exposes
// some current state of the githubRepoList template
// to be used by other templates
githubRepoList = new ghRL();


// Local collection 'ghOrgs' for GitHub Organizations
// It contains objects like this:
//
// {
//   _id: 28239280
//   full_name: 'MeteorPackaging/autopublish-test'
//   html_url: 'https://github.com/MeteorPackaging/autopublish-test'
//   name: 'autopublish-test'
//   permissions: {
//     admin: true
//     pull: true
//     push: true
//   }
//   private: false
// }
var ghRepos = new Mongo.Collection('ghRepos');

// Handle for the subscription to current user's organizations
var sub;

Tracker.autorun(function () {
  // Possibly clears the selected organization source when the user logs out
  if (!Meteor.user()){
    githubRepoList.clearSelectedOrg();
  }

  // Possibly stops a previous subscription
  if (sub) {
    sub.stop();
  }
  // Subscribe to the list of GitHub organizations
  sub = Meteor.subscribe('ghRepos', githubRepoList._selectedOrg.get());
});



Template.githubRepoList.rendered = function(){
  // Adds the current instance to the array of template instances
  githubRepoList._instances.push(this);
};

Template.githubRepoList.destroyed = function(){
  // Possibly removes the current instance from the array of template instances
  var index = githubRepoList._instances.indexOf(this);
  if (index > -1) {
    githubRepoList._instances.splice(index, 1);
  }
};


Template.githubRepoList.helpers({
  active: function(){
    // Returns 'active' for the item corresponding to the selected repository
    return githubRepoList.getActiveRepo() === this._id ? 'active' : undefined;
  },
  floatTmpl: function() {
    // Returns the name of the template to be possibly put as a right float
    // on each repository item
    return githubRepoList.floatTmpl;
  },
  repos: function(){
    // Returns organizations sorted by 'name'
    return ghRepos.find({}, {sort: {name: 1}});
  },
  ready: function(){
    // Trick to make this function reactive and
    // be executed again on current user changes...
    Meteor.user();

    // In case there's an open subscription
    // returns its readyness status
    return sub && sub.ready();
  },
  source: function(){
    return !!githubRepoList.getSelectedOrg();
  },
});

Template.githubRepoList.events({
  'click .item': function(){
    // Changes the current active repository when a list item is clicked
    githubRepoList.setActiveRepo(this._id);
  },
});
