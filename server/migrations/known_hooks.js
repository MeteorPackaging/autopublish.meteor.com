/* global
    HookPayloads: false,
    processHookPingEvent: false,
    github: false
*/
'use strict';

/*
Meteor.startup(function(){
  // Create KnownHooks documents from ping events received in the past
  HookPayloads.find().forEach(function(doc){
    var payload = doc.payload;
    if (payload.zen) {
      processHookPingEvent(payload);
    }
  });
});
*/

/*
var hookDetails = {
  user: "MeteorPackaging",
  repo: "autopublish-test",
  id: 4797246,
};

github.authenticate({
  type: "token",
  token: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
});
github.repos.getHook(hookDetails, function(err, res){
  console.log('GET HOOK:');
  console.log(err);
  console.log(res);
  if (!err) {
    hookDetails.name = res.name;
    hookDetails.config = res.config;
    hookDetails.events = ['release'];
    hookDetails.config.url = res.config.url.replace('http://', 'https://');
    github.repos.updateHook(hookDetails, function(err, res){
      console.log('UPDATE HOOK:');
      console.log(err);
      console.log(res);
    });
  }
});
*/

/*
{ [Error: {"message":"Not Found","documentation_url":"https://developer.github.com/v3"}]
  message: '{"message":"Not Found","documentation_url":"https://developer.github.com/v3"}',
  code: 404 }
*/

/*
{ [Error: {"message":"Bad credentials","documentation_url":"https://developer.github.com/v3"}],
  message: '{"message":"Bad credentials","documentation_url":"https://developer.github.com/v3"}',
  code: 401 }
*/
