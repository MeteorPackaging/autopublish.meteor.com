'use strict';

/*
GitHub API Resources:

https://developer.github.com/v3/repos/hooks/
https://github.com/mikedeboer/node-github
http://mikedeboer.github.io/node-github/

- Orgs

https://developer.github.com/v3/orgs/
http://mikedeboer.github.io/node-github/#orgs

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

Meteor.publish('ghOrgs', function(){
  var
    self = this,
    user = Meteor.users.findOne(this.userId)
  ;

  if (user){
    var
      ghs = user.services.github,
      token = ghs && ghs.accessToken,
      username = ghs && ghs.username
    ;

    if (token) {
      github.authenticate({
        type: "oauth",
        token: token
      });
    }

    github.orgs.getFromUser({
      user: username
    }, function(err, data) {
      if (!err) {
        _.each(data, function(org){
          self.added("ghOrgs", org.id, {
            name: org.login,
            avatarUrl: org.avatar_url,
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
