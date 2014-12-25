'use strict';
/* global githubOrgList: true */


var
  ghOrgs = new Mongo.Collection("ghOrgs"),
  sub,
  ghOL = function(){}
;

ghOL.prototype._activeOrg = new ReactiveVar();

ghOL.prototype._instances = [];

ghOL.prototype.clearActiveOrg = function(){
  return this._activeOrg.set(undefined);
};

ghOL.prototype.getActiveOrg = function(){
  return this._activeOrg.get();
};

ghOL.prototype.instances = function(){
  return this._instances;
};

ghOL.prototype.setActiveOrg = function(orgObj){
  check(orgObj, Object);
  // Checks if an organization with _id *id* exists
  if (ghOrgs.findOne({_id: orgObj._id})) {
    // Sets it as the active one
    this._activeOrg.set(orgObj);
    return true;
  }

  // Clears the active organization, since the required one does not exist
  this._activeOrg.set(undefined);
  return false;
};

// Instantiation of the githubOrgList which exposes some current state
// of the githubOrgList template
githubOrgList = new ghOL();


Tracker.autorun(function () {
  // Trick to make the call reactive tu current user changes...
  Meteor.user();
  // Possibly stops the previsous subscription
  if (sub) {
    sub.stop();
  }
  // Subscribe to the list of GitHub organizations
  sub = Meteor.subscribe("ghOrgs");
});

Template.githubOrgList.rendered = function(){
  // Adds the current instance to the list of template instances
  githubOrgList._instances.push(this);
};

Template.githubOrgList.destroyed = function(){
  // Possibly removes the current instance from the list of template instances
  var index = githubOrgList._instances.indexOf(this);
  if (index > -1) {
    githubOrgList._instances.splice(index, 1);
  }
};


Template.githubOrgList.helpers({
  orgs: function(){
    // Returns organizations' name alphabetically sorted
    return ghOrgs.find({}, {sort: {name: 1}});
  },
  active: function(){
    // Returns 'active' in case this item corresponds to the active one
    var activeOrg = githubOrgList.getActiveOrg();
    if (activeOrg && activeOrg._id === this._id){
      return 'active';
    }
  },
  ready: function(){
    // Trick to make the call reactive tu current user changes...
    Meteor.user();

    // Returns the readyness status of the subscription
    return sub && sub.ready();
  },
});

Template.githubOrgList.events({
  'click .item': function(){
    // Changes the current active organization
    githubOrgList.setActiveOrg(this);
  },
});
