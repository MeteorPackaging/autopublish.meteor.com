'use strict';

Template.navButton.helpers({
  icon: function() {
    return Meteor.user() ? '' : 'github square icon';
  },
  text: function() {
    return Meteor.user() ? 'Sign out' : 'Login with GitHub';
  }
});

Template.navButton.events({
  'click #nav-button': function() {
    if (Meteor.user()) {
      Meteor.logout();
    }
    else {
      Meteor.loginWithGithub({
        requestPermissions: [
          'user:email',
          'admin:repo_hook',
        ]
      }, function(err){
        if (!err) {
          Router.go('accounts');
        }
      });
    }
  },
});
