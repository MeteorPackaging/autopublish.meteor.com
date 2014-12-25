'use strict';

/*
GitHub API Resources:

https://developer.github.com/v3/repos/hooks/
https://github.com/mikedeboer/node-github
http://mikedeboer.github.io/node-github/

- Repos

https://developer.github.com/v3/repos/
http://mikedeboer.github.io/node-github/#repositories

- Hooks

http://mikedeboer.github.io/node-github/#repos.prototype.getHook
http://mikedeboer.github.io/node-github/#repos.prototype.getHooks
http://mikedeboer.github.io/node-github/#repos.prototype.createHook
https://developer.github.com/v3/repos/hooks/#create-a-hook

*/


var GithubApi = Npm.require('github');

var github = new GithubApi({
  version: "3.0.0"
});

Meteor.publish('ghRepos', function(orgName){
  if (!orgName) {
    return this.ready();
  }

  check(orgName, Match.OneOf(String, Number));
  var
    self = this,
    user = Meteor.users.findOne(this.userId)
  ;

  if (user){
    var
      ghs = user.services.github,
      token = ghs && ghs.accessToken
    ;

    if (token) {
      github.authenticate({
        type: "oauth",
        token: token
      });
    }

    github.repos.getFromOrg({
      org: orgName
    }, function(err, data) {
      if (!err) {
        console.dir(data);
        _.each(data, function(repo){
          self.added("ghRepos", repo.id, {
            name: repo.name,
          });
        });
      }
      self.ready();
    });
  }
  else{
    self.ready();
  }
});
