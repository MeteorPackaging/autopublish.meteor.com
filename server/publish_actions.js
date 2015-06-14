'use strict';
/* global
    AutoPublish: false,
    github: false,
    oldestQueueing: false,
    queueingSelector: false,
    regularPublish: false,
    regularPublishForArch: false,
    Subscriptions: false
*/


var availableArchitectures = [
  'os.linux.x86_32',
  'os.linux.x86_64',
  'os.osx.x86_64',
  'os.windows.x86_32',
];

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

      try {
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

          // Publish for all architectures in case of
          // first `meteor publish` of a binary package
          if (next.binary && !next.forArch) {
            // Insert a publish operation for each different architecture
            _.each(availableArchitectures, function(arch){
              AutoPublish.insert({
                binary: true,
                forArch: arch,
                createdAt: new Date(),
                publishedAt: next.publishedAt,
                pkgName: next.pkgName,
                tagName: next.tagName,
                releaseTargetCommittish: next.releaseTargetCommittish,
                repoCloneUrl: next.repoCloneUrl,
                status: 'queueing',
                version: result.version,
              });
            });
          }

        } else {
          var
            userCredentials = Meteor.settings.defaultGitHubUser,
            failedPublishIssue = _.clone(Meteor.settings.issues.failedPublish)
          ;

          // Adds the body for the issue
          failedPublishIssue.body =
            'Publish for package ' +
            next.pkgName +
            ' failed, please revise!'
          ;

          github.authenticate({
            type: "basic",
            username: userCredentials.userName,
            password: userCredentials.pwd
          });
          github.issues.createComment(failedPublishIssue);
        }
      }
      catch (err) {
        console.log('Some error occured after publishing operations!');
        console.dir(err);
      }
      // Goes to the next queueing package (in case it exists...)
      publishNextPackage();
    });

    // Starts publishing operations...
    try {
      // Select appropriate workflow...
      if (next.binary && next.forArch) {
        regularPublishForArch(next, publishCallback);
      }
      else {
        regularPublish(next, publishCallback);
      }
    }
    catch (err) {
      console.log('Some error occured during publishing operations!');
      console.dir(err);
    }
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
AutoPublish.find(queueingSelector, oldestQueueing).observeChanges({
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
