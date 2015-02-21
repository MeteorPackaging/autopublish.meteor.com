'use strict';

/* global
    AutoPublish: false,
    completedSelector: false,
    newestCompleted: false,
    oldestQueueing: false,
    queueingSelector: false,
    Statistics: false,
    Subscriptions: false
*/

Template.home.helpers({
  // Alphabetically sorted
  alpha: {sort: {pkgName: 1}},
  // Returns the AutoPublish collection
  AutoPublish: AutoPublish,
  // Returns the selector to be used to retrieve completed publish operations
  completedSelector: completedSelector,
  completedTitle: function() {
    var stats = Statistics.findOne();
    var publishCounts = stats && stats.publishCounts;
    if (publishCounts && (publishCounts.successful || publishCounts.errored)) {
      var title = "Completed Publish <span>";
      if (publishCounts.successful) {
        title +=
          '<i class="green check circle icon"></i>' +
          publishCounts.successful + ' '
        ;
      }
      if (publishCounts.errored) {
        title +=
          '<i class="red minus circle icon"></i>' +
          publishCounts.errored + ' '
        ;
      }
      title += '</span>';

      return title;
    }
    return "Completed Publish";
  },
  // Newest completed first
  newest: newestCompleted,
  // Oldest queueing first
  oldest: oldestQueueing,
  subsTitle: function() {
    var stats = Statistics.findOne();
    if (stats) {
      return "Subscriptions (" + stats.subsCount + ")";
    }
    return "Subscriptions";
  },
  // Returns the Subscriptions collection
  Subscriptions: Subscriptions,
  // Returns the selector to be used to retrieve queueing publish operations
  queueingSelector: queueingSelector,
  queueingTitle: function() {
    var stats = Statistics.findOne();
    if (stats && stats.publishCounts.queueing !== 0) {
      return "Queueing Publish (" + stats.publishCounts.queueing + ")";
    }
    return "Queueing Publish";
  },
});
