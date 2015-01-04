'use strict';

Package.describe({
  name: 'packaging:load-more-list',
  summary: 'Stand-alone template to show a paginated list of items with a load more button.',
  version: '1.0.0',
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.2');

  api.use([
    'mongo',
  ], ['client']);

    api.use([
    'reactive-var',
    'templating',
  ], 'client');

  api.addFiles([
    'lib/load_more_list.html',
    'lib/load_more_list.js'
  ], 'client');
});
