'use strict';

Package.describe({
  name: 'packaging:github-org-list',
  summary: 'Stand-alone template to list a GitHub users\' organizations.',
  version: '1.0.0',
});

Npm.depends({github: '0.2.3'});

Package.onUse(function(api) {
  api.versionsFrom('1.0.2');

  api.use([
    'underscore',
  ], 'server');

  api.addFiles([
    'lib/server.js'
    ], 'server');

  api.use([
    'templating',
    'tracker',
  ], 'client');

  api.use([
    'mongo',
  ], ['client', 'server']);

  api.addFiles([
    'lib/github_org_list.html',
    'lib/github_org_list.js'
  ], 'client');
});
