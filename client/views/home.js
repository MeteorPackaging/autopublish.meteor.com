'use strict';

/* global AutoPublish: false, Subscriptions: false */

Template.home.helpers({
  AutoPublish: AutoPublish,
  Subscriptions: Subscriptions,
  queueing: function(){
    // Returns the selector to be used to retrieve queueing publish operations
    return {
      completedAt: { $exists: false }
    };
  },
  completed: function(){
    // Returns the selector to be used to retrieve completed publish operations
    return {
      completedAt: { $exists: true }
    };
  },
});
