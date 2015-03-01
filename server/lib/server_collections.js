/* global
    HookPayloads: true,
    KnownHooks: true
*/

HookPayloads = new Mongo.Collection('hookpayloads');



KnownHooks =  new Mongo.Collection('knownhooks');


/*
Sample KnownHooks document:

{
  approved: true,
  alive: true,
  lastSeen: Date,
  lastTested: Date,
  hook_id: 4222698,
  hook: {
    url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/hooks/4222698',
    test_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/hooks/4222698/test',
    ping_url: 'https://api.github.com/repos/MeteorPackaging/autopublish-test/hooks/4222698/pings',
    id: 4222698,
    name: 'web',
    active: true,
    events: [ 'create' ],
    config: {
      url: 'https://6da15956.ngrok.com/publish',
      content_type: 'json'
    },
    last_response: {
      code: null,
      status: 'unused',
      message: null
    },
    updated_at: '2015-02-28T09:30:56Z',
    created_at: '2015-02-28T09:30:56Z'
  },
  repository: {
    {
      id: 28239280,
      name: 'autopublish-test',
      full_name: 'MeteorPackaging/autopublish-test'
    }
  }
}
*/
