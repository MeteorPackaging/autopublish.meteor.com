'use strict';
/* global
    AutoPublish: false,
    oldestQueueing: false,
    regularPublish: false,
    queueingSelector: false,
    Subscriptions: false
*/

var isPublishing = false;

var nextPkg = function(){
  return AutoPublish.findOne(queueingSelector, oldestQueueing);
};

var publishNextPackage = function(){
  // Picks up the next queueing package...
  var next = nextPkg();

  if (next) {
    var publishCallback = Meteor.bindEnvironment(function(result){
      // Updates the queueing document and set is as completed
      var setter = {
        completedAt: new Date(),
        log: result.log,
      };

      if (result.success) {
        setter.status = 'successful';
        setter.version = result.version;
      }
      else {
        setter.status = 'errored';
        setter.errors = result.errors;
      }

      AutoPublish.update(next._id, {$set: setter, $unset: {publishing: 1}});

      // Updates the subscription object to show the latest version
      if (result.success) {
        Subscriptions.update({
          pkgName: next.pkgName
        }, {
          $set: {
            pkgVersion: result.version
          }
        });
      }

      // Goes to the next queueing package (in case it exists...)
      publishNextPackage();
    });

    // Starts publishing operations...
    regularPublish(next, publishCallback);
  }
  else {
    // Marks the end of publishing
    isPublishing = false;
  }
};

// Marks the start of publishing
isPublishing = true;
// Possibly publishes queueing packages on start-up
publishNextPackage();

// Observes documents added to the AutoPublish queue
AutoPublish.find(queueingSelector, {
  sort: {
    createdAt: 1,
  }
}).observeChanges({
  added: function () {
    // Start Publishing new queueing packages if not already started...
    if (!isPublishing) {
      // Marks the start of publishing
      isPublishing = true;
      // Starts publishing operations right after returning from this callback
      Meteor.defer(publishNextPackage);
    }
  }
});
