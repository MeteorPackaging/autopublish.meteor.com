'use strict';

/*
GitHub API Resources:

https://developer.github.com/v3/
http://mikedeboer.github.io/node-github/
https://github.com/mikedeboer/node-github
https://github.com/mikedeboer/node-github/blob/master/api/v3.0.0/routes.json

- Repositories

https://developer.github.com/v3/repos/
http://mikedeboer.github.io/node-github/#repositories

*/


var GithubApi = Npm.require('github');

var github = new GithubApi({
  version: '3.0.0'
});

Meteor.publish('ghRepos', function(source){
  if (!source) {
    // Retturns no documents in case source is undefined
    return this.ready();
  }
  check(source, Object);

  var
    self = this,
    user = Meteor.users.findOne(this.userId)
  ;

  // Checks there's a logged in user
  if (user){
    // Picks up access token from service data
    var
      ghs = user.services.github,
      token = ghs && ghs.accessToken
    ;

    // Provides authorization details for the next github call
    if (token) {
      github.authenticate({
        type: 'oauth',
        token: token
      });
    }

    // Defaults parameter for API method:
    // - all types of repositories
    // - up to 100 result per page (hopefully enough to get a single page...)
    var msg = {
      type : 'all',
      per_page: 100,
    };

    // Selects the method based on the souce type
    var  method;
    if (source.type === 'user'){
      // Gets all user's repositories
      // in case the source is the user
      method = github.repos.getAll;
    }
    else {
      // Gets all organization's repositories
      // in case the source is an organization
      method = github.repos.getFromOrg;

      // Additionally specifies the parameter with the organization name
      msg.org = source.login;
    }

    // Actually calls the method
    method(msg, function(err, data) {
      if (!err) {
        // In case of successful return provides a new document
        // into the 'fake' ghRepos collection for each found repository
        _.each(data, function(repo){
          var repoId = repo.id;

          // Sanity check: not all objects actually represent an organization
          if (repoId) {

            // Keeps only a few fields
            var repoObj = _.pick(repo, [
                'name',
                'full_name',
                'private',
                'html_url',
                'permissions'
            ]);

            // Signals the new document
            self.added('ghRepos', repoId, repoObj);
          }
        });
      }
      // When all repositories have been processed,
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
