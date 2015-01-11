'use strict';
/* global
    AutoPublish: false,
    publishPackage: false,
    queueingSelector: false
*/

var publishing = false;

var nextPkg = function(){
  return AutoPublish.findOne(queueingSelector, {
    sort: {
      createdAt: 1,
    }
  });
};

var publishNextPackage = function(){
  // Picks up the next queueing package...
  var next = nextPkg();

  if (next) {
    var publishCallback = Meteor.bindEnvironment(function(err, result){
      if (err) {
        AutoPublish.update(next._id, {
          $unset: { publishing: ""}
        });
      }
      else {
        // Updates the queueing document and set is as completed
        var setter = {
          completedAt: new Date(),
          log: result.log,
        };

        if (result.success){
          setter.status = 'successful';
          setter.version = result.version;
        }
        else {
          setter.status = 'errored';
          setter.errors = result.errors;
        }

        AutoPublish.update(next._id, {
          $set: setter,
          $unset: {publishing: ""}
        });
      }

      // Goes to the next queueing package (in case it exists...)
      publishNextPackage();
    });

    // Starts publishing operations...
    publishPackage(next, publishCallback);
  }
  else {
    // Marks the end of publishing
    publishing = false;
  }
};

// Marks the start of publishing
publishing = true;
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
    if (!publishing) {
      // Marks the start of publishing
      publishing = true;

      // Starts publishing operations right after returning from this callback
      Meteor.defer(publishNextPackage);
    }
  }
});
