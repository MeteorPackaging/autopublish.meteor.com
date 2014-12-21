'use strict';

// Set up login services
Meteor.startup(function() {
  ServiceConfiguration.configurations.update({
    "service": "github"
  },{
    $set: {
      "clientId": "XXXXXXXXXXXXXXXXXX",
      "secret": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
  }, {
    upsert: true
  });
});
