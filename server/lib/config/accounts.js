'use strict';

// Set up login services
Meteor.startup(function() {
  ServiceConfiguration.configurations.update({
    "service": "github"
  },{
    $set: {
      "clientId": Meteor.settings.ghClientId,
      "secret": Meteor.settings.ghSecret
    }
  }, {
    upsert: true
  });
});
