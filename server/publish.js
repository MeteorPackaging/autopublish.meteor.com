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
    _.extend({limit: limit}, oldestQueueing)
  );
});

Meteor.publish('completedPublish', function(limit){
  check(limit, Number);
  return AutoPublish.find(
    completedSelector,
    _.extend({limit: limit}, newestCompleted)
  );
});

Meteor.publish('subscriptions', function(limit){
  check(limit, Number);
  return Subscriptions.find({}, {limit: limit});
});
