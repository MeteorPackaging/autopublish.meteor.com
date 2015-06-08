/* global
    Async: false,
    Accounts: false,
    GithubApi: false
*/
'use strict';

Accounts.onCreateUser(function(options, user) {
  var
    ghs = user.services.github,
    github = new GithubApi({version: "3.0.0"}),
    email = ghs && ghs.email,
    token = ghs && ghs.accessToken
  ;

  user.profile = options.profile || {};

  if (email) {
    user.emails = [{
      address: email,
      verified: false,
    }];
  }

  if (token) {
    github.authenticate({
      type: 'oauth',
      token: token
    });
  }

  var get = Async.runSync(function(done) {
    github.user.get({}, function(err, data) {
      done(null, data);
    });
  });
  if (get.result) {
    user.profile.login = get.result.login;
    user.profile.avatar_url = get.result.avatar_url;
  }

  return user;
});
