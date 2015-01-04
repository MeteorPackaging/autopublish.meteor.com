'use strict';

/* global
    AutoPublish: false,
    completedSelector: false,
    newestCompleted: false,
    oldestQueueing: false,
    queueingSelector: false,
    Subscriptions: false
*/

Template.home.helpers({
  // Alphabetically sorted
  alpha: {pkgName: 1},
  // Returns the AutoPublish collection
  AutoPublish: AutoPublish,
  // Returns the selector to be used to retrieve completed publish operations
  completedSelector: completedSelector,
  // Newest completed first
  newest: newestCompleted,
  // Oldest queueing first
  oldest: oldestQueueing,
  // Returns the Subscriptions collection
  Subscriptions: Subscriptions,
  // Returns the selector to be used to retrieve queueing publish operations
  queueingSelector: queueingSelector,
});
