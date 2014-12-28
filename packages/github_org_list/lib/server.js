'use strict';

/*
GitHub API Resources:

https://developer.github.com/v3/
http://mikedeboer.github.io/node-github/
https://github.com/mikedeboer/node-github
https://github.com/mikedeboer/node-github/blob/master/api/v3.0.0/routes.json

- Orgs

https://developer.github.com/v3/orgs/
http://mikedeboer.github.io/node-github/#orgs

*/


var GithubApi = Npm.require('github');

var github = new GithubApi({
  version: '3.0.0'
});

Meteor.publish('ghOrgs', function(){
  var
    self = this,
    user = Meteor.users.findOne(this.userId)
  ;

  // Checks there's a logged in user
  if (user){
    // Picks up username and access token from service data
    var
      ghs = user.services.github,
      token = ghs && ghs.accessToken,
      username = ghs && ghs.username
    ;

    // Provides authorization details for the next github call
    if (token) {
      github.authenticate({
        type: 'oauth',
        token: token
      });
    }

    // Gets the list of organization for the current user
    github.orgs.getFromUser({
      user: username
    }, function(err, data) {
      if (!err) {
        // In case of successful return provides a new document
        // into the 'fake' ghOrgs collection for each found organization
        _.each(data, function(org){
          var orgId = org.id;

          // Sanity check: not all objects actually represent an organization
          if (orgId) {

            // Keeps only 'login' (the organization name) and 'avatar_url'
            var orgObj = _.pick(org, [
              'login',
              'avatar_url',
            ]);

            // Adds a lower cased name just for sorting purposes
            orgObj.name = orgObj.login.toLowerCase();

            // Signals the new document
            self.added('ghOrgs', orgId, orgObj);
          }
        });
      }

      // When all organizations have been processed,
      // sets the subscription as ready
      self.ready();
    });
  }
  else{
    // In case there's no user logged in,
    // sets the subscription as ready straight on
    self.ready();
  }
});
