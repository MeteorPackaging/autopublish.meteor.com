'use strict';
/* global githubRepoList: true */


var
  ghRepos = new Mongo.Collection("ghRepos"),
  sub,
  ghRL = function(){}
;

ghRL.prototype._activeRepo = new ReactiveVar();

ghRL.prototype._instances = [];

ghRL.prototype.clearActiveRepo = function(){
  return this._activeRepo.set(undefined);
};

ghRL.prototype.getActiveRepo = function(){
  return this._activeRepo.get();
};

ghRL.prototype.instances = function(){
  return this._instances;
};

ghRL.prototype.setActiveRepo = function(id){
  check(id, Number);
  // Checks if an organization with _id *id* exists
  if (ghRepos.findOne({_id: id})) {
    // Sets it as the active one
    this._activeRepo.set(id);
    return true;
  }

  // Clears the active organization, since the required one does not exist
  this._activeRepo.set(undefined);
  return false;
};

// Instantiation of the githubRepoList which exposes some current state
// of the githubRepoList template
githubRepoList = new ghRL();


Tracker.autorun(function () {
  // Trick to make the call reactive tu current user changes...
  Meteor.user();
  // Possibly stops the previsous subscription
  if (sub) {
    sub.stop();
  }
  // Subscribe to the list of GitHub organizations
  sub = Meteor.subscribe("ghRepos");
});

Template.githubRepoList.rendered = function(){
  // Adds the current instance to the list of template instances
  githubRepoList._instances.push(this);
};

Template.githubRepoList.destroyed = function(){
  // Possibly removes the current instance from the list of template instances
  var index = githubRepoList._instances.indexOf(this);
  if (index > -1) {
    githubRepoList._instances.splice(index, 1);
  }
};


Template.githubRepoList.helpers({
  orgs: function(){
    // Returns organizations' name alphabetically sorted
    return ghRepos.find({}, {sort: {name: 1}});
  },
  active: function(){
    // Returns 'active' in case this item corresponds to the active one
    return githubRepoList.getActiveRepo() === this._id ? 'active' : undefined;
  },
  ready: function(){
    // Trick to make the call reactive tu current user changes...
    Meteor.user();

    // Returns the readyness status of the subscription
    return sub && sub.ready();
  },
});

Template.githubRepoList.events({
  'click .item': function(){
    // Changes the current active organization
    githubRepoList.setActiveRepo(this._id);
  },
});
