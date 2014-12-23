'use strict';

var
  ghOrgs = new Mongo.Collection("ghOrgs"),
  sub
;

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

Template.githubOrgList.helpers({
  orgs: function(){
    // Returns organizations' name alphabetically sorted
    return ghOrgs.find({}, {sort: {name: 1}});
  },
  ready: function(){
    // Trick to make the call reactive tu current user changes...
    Meteor.user();

    // Returns the readyness status of the subscription
    return sub && sub.ready();
  },
});
