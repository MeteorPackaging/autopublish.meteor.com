/* global
 GithubApi: true
*/

GithubApi = Meteor.npmRequire('github');

/*
GitHub API Resources:

https://developer.github.com/v3/repos/hooks/
https://github.com/mikedeboer/node-github
http://mikedeboer.github.io/node-github/

// See also https://github.com/philschatz/octokat.js


- Hooks

http://mikedeboer.github.io/node-github/#repos.prototype.getHook
http://mikedeboer.github.io/node-github/#repos.prototype.getHooks
http://mikedeboer.github.io/node-github/#repos.prototype.createHook
https://developer.github.com/v3/repos/hooks/#create-a-hook
*/
