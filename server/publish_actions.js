'use strict';
/* global AutoPublish: false, queueingSelector: false */

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

  // Publishes the next package until there is one...
  while(!!next) {
    console.log("Now publishing: " + next.pkgName);

    // Fake publishing operation...
    Meteor._sleepForMs(3000);

    // Updates the queueing document and set is as completed
    AutoPublish.update(next._id, {
      $set: {
        completedAt: new Date(),
        status: 'successful',
      }
    });

    // Picks up the next queueing package...
    next = nextPkg();
  }

  // Marks the end of publishing
  publishing = false;
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
