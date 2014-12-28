'use strict';
/* global githubOrgList: true */

/**
* githubOrgList module
* provides both a 'githubOrgList' template to list a GitHub user's organizations
* and a 'githubOrgList' object reactively providing the status of the template
* @exports githubOrgList
* @version 1.0
*/

// Local collection 'ghOrgs' for GitHub Organizations
// It contains objects like this:
//
// {
//   _id: 10003264
//   avatar_url: 'https://avatars.githubusercontent.com/u/10003264?v=3'
//   login: 'MeteorPackaging'
//   name: 'meteorpackaging'
//   type: 'org'
// }
var ghOrgs = new Mongo.Collection('ghOrgs');


/**
* githubOrgList @class
* @constructor
*/
var ghOL = function(){};

/**
* Reactive object referencing the currently selected organization item.
* @private @var
*/
ghOL.prototype._activeOrg = new ReactiveVar();

/**
* Array of rendered template instances.
* @private @var
*/
ghOL.prototype._instances = [];

/**
* Clears the active organization.
* @method
*/
ghOL.prototype.clearActiveOrg = function(){
  return this._activeOrg.set(undefined);
};

/**
* Retrieves the active organization.
* @method
*/
ghOL.prototype.getActiveOrg = function(){
  return this._activeOrg.get();
};

/**
* Retrieves the list of rendered template instances.
* @method
*/
ghOL.prototype.instances = function(){
  return this._instances;
};

/**
* Sets the active organization.
* @method
* @param {object} orgObj - The organization to be set as the active one.
* Returns true in case of successful active organization update.
*/
ghOL.prototype.setActiveOrg = function(orgObj){
  if (!orgObj){
    this._activeOrg.set(undefined);
    return true;
  }
  check(orgObj, Object);

  var user = Meteor.user();

  // Checks if an organization with _id *id* exists
  // or if the provided object represents the user
  if (ghOrgs.findOne({_id: orgObj._id}) || (user && user._id === orgObj._id)) {
    var activeOrg = this._activeOrg.get();

    // Checks it is not already the current one
    // to prevent useless reactive re-computations
    if (!activeOrg || activeOrg._id !== orgObj._id) {
      // Sets it as the active one
      this._activeOrg.set(orgObj);
    }
    return true;
  }

  // Clears the active organization, in case the provided reference is invalid
  this._activeOrg.set(undefined);
  return false;
};

// Instantiation of the githubOrgList which exposes
// some current state of the githubOrgList template
// to be used by other templates
githubOrgList = new ghOL();


// Handle for the subscription to current user's organizations
var sub;

Tracker.autorun(function () {
  // Possibly clears the active organization when the user logs out
  if (!Meteor.user()){
    githubOrgList.clearActiveOrg();
  }

  // Possibly stops a previous subscription
  // This is needed to get a fresh new subscription with false readiness satus
  // when a user logs in. Otherwise the 'sub.ready()' seems to stay true...
  if (sub) {
    sub.stop();
  }

  // Subscribe to the list of GitHub organizations for the current user
  sub = Meteor.subscribe('ghOrgs');
});



Template.githubOrgList.rendered = function(){
  // Adds the current instance to the array of template instances
  githubOrgList._instances.push(this);
};

Template.githubOrgList.destroyed = function(){
  // Possibly removes the current instance from the array of template instances
  var index = githubOrgList._instances.indexOf(this);
  if (index > -1) {
    githubOrgList._instances.splice(index, 1);
  }
};

Template.githubOrgList.helpers({
  user: function(){
    // Provides the object representing the current logged in user.
    var user = Meteor.user();
    if (user) {
      return {
        _id: user._id,
        avatar_url: user.profile.avatar_url,
        login: user.profile.login,
        name: user.profile.name,
        type: 'user',
      };
    }
  },
  orgs: function(){
    // Returns organizations sorted by lower case 'login' (i.e. 'name')
    // and adds a special `type` field to distinguish organization objects
    // from the one about the current user
    // returned objects are like this:
    //
    // {
    //   _id: 10003264
    //   avatar_url: 'https://avatars.githubusercontent.com/u/10003264?v=3'
    //   login: 'MeteorPackaging'
    //   name: 'meteorpackaging'
    //   type: 'org'
    // }
    return ghOrgs.find({}, {sort: {name: 1}, transform: function(org){
      org.type = 'org';
      return org;
    }});
  },
  active: function(){
    // Returns 'active' for the item corresponding to the selected organization
    var activeOrg = githubOrgList.getActiveOrg();
    if (activeOrg && activeOrg._id === this._id){
      return 'active';
    }
  },
  ready: function(){
    // Trick to make this function reactive and
    // be executed again on current user changes...
    Meteor.user();

    // In case there's an open subscription
    // returns its readyness status
    return sub && sub.ready();
  },
});

Template.githubOrgList.events({
  'click .item': function(){
    // Changes the current active organization when a list item is clicked
    githubOrgList.setActiveOrg(this);
  },
});
