'use strict';

/* global
    AutoPublish: false,
    completedSelector: false,
    newestCompleted: false,
    oldestQueueing: false,
    queueingSelector: false,
    Subscriptions: false
*/

Meteor.publish('queueingPublish', function(limit){
  check(limit, Number);
  return AutoPublish.find(queueingSelector,
    _.extend(
      {limit: limit},
      oldestQueueing,
      {
        fields: {
          createdAt: 0,
          log: 0,
          releaseTargetCommittish: 0,
          repoCloneUrl: 0,
          version: 0,
        }
      }
    )
  );
});

Meteor.publish('completedPublish', function(limit){
  check(limit, Number);
  return AutoPublish.find(
    completedSelector,
    _.extend(
      {limit: limit},
      newestCompleted,
      {
        fields: {
          createdAt: 0,
          log: 0,
          releaseTargetCommittish: 0,
          repoCloneUrl: 0,
          tagName: 0,
        }
      }
    )
  );
});

Meteor.publish('subscriptions', function(limit){
  check(limit, Number);
  return Subscriptions.find({}, {
    limit: limit,
    fields: {
      hookEvents: 0,
      hookId: 0,
      repo: 0,
      repoId: 0,
      tested: 0,
      user: 0
    }
  });
});
