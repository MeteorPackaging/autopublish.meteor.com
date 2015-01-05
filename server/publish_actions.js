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
      console.log("Done!");
      if (err) {
        console.log("Error:");
        console.log(err);
      }
      else {
        console.log("Result:");
        console.dir(result);

        // Updates the queueing document and set is as completed
        AutoPublish.update(next._id, {
          $set: {
            completedAt: new Date(),
            status: 'successful',
          }
        });
      }

      // Goes to the next queueing package (in case it exists...)
      publishNextPackage();
    });

    // Starts publishing operations...
    console.log("Now publishing: " + next.pkgName);
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
