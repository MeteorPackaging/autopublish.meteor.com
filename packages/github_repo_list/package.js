'use strict';

Package.describe({
  name: 'packaging:github-repo-list',
  summary: 'Stand-alone template to list a GitHub users\' repositories.',
  version: '1.0.0',
});

Npm.depends({github: '0.2.3'});

Package.onUse(function(api) {
  api.versionsFrom('1.0.2');

  api.use([
    'mongo',
  ], ['client', 'server']);

  api.use([
    'underscore',
  ], 'server');

  api.addFiles([
    'lib/server.js'
    ], 'server');

  api.use([
    'reactive-var',
    'templating',
    'tracker',
  ], 'client');

  api.addFiles([
    'lib/github_repo_list.html',
    'lib/github_repo_list.js'
  ], 'client');

  api.export('githubRepoList', 'client');
});
