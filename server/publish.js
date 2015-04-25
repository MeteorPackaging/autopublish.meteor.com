'use strict';

/* global
    AutoPublish: false,
    completedSelector: false,
    KnownHooks: false,
    newestCompleted: false,
    oldestQueueing: false,
    queueingSelector: false,
    Roles: false,
    SearchSource: false,
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
    sort: {pkgName: 1},
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


// server: publish the current size of a collection
var statsCollectionName = "statistics";
Meteor.publish(statsCollectionName, function () {
  var
    self = this,
    initializing = true,
    objId = "_stats",
    subsCount = 0,
    hooksCount = 0,
    publishCounts = {
      queueing: 0,
      successful: 0,
      errored: 0,
    }
  ;


  // observeChanges only returns after the initial `added` callbacks
  // have run. Until then, we don't want to send a lot of
  // `self.changed()` messages - hence tracking the
  // `initializing` state.
  var subsHandle = Subscriptions.find().observeChanges({
    added: function () {
      subsCount++;
      if (!initializing) {
        self.changed(statsCollectionName, objId, {subsCount: subsCount});
      }
    },
    removed: function () {
      subsCount--;
      self.changed(statsCollectionName, objId, {subsCount: subsCount});
    }
    // don't care about changed
  });

  var hooksHandle = KnownHooks.find().observeChanges({
    added: function () {
      hooksCount++;
      if (!initializing) {
        self.changed(statsCollectionName, objId, {hooksCount: hooksCount});
      }
    },
    removed: function () {
      hooksCount--;
      self.changed(statsCollectionName, objId, {hooksCount: hooksCount});
    }
    // don't care about changed
  });

  var autopubHandle = AutoPublish.find().observe({
    added: function (document) {
      if (document.status) {
        publishCounts[document.status]++;
        if (!initializing) {
          self.changed(statsCollectionName, objId, {
            publishCounts: publishCounts
          });
        }
      }
    },
    changed: function (newDocument, oldDocument) {
      if (oldDocument.status !== newDocument.status){
        if (oldDocument.status) {
          publishCounts[oldDocument.status]--;
        }
        if (newDocument.status) {
          publishCounts[newDocument.status]++;
        }
        if (!initializing) {
          self.changed(statsCollectionName, objId, {
            publishCounts: publishCounts
          });
        }
      }
    },
    removed: function (oldDocument) {
      if (oldDocument.status) {
        publishCounts[document.status]--;
        if (!initializing) {
          self.changed(statsCollectionName, objId, {
            publishCounts: publishCounts
          });
        }
      }
    }
  });

  // Instead, we'll send one `self.added()` message right after
  // observeChanges has returned, and mark the subscription as
  // ready.
  initializing = false;
  self.added(statsCollectionName, objId, {
    subsCount: subsCount,
    hooksCount: hooksCount,
    publishCounts: publishCounts
  });
  self.ready();

  // Stop observing the cursor when client unsubs.
  // Stopping a subscription automatically takes
  // care of sending the client any removed messages.
  self.onStop(function () {
    subsHandle.stop();
    hooksHandle.stop();
    autopubHandle.stop();
  });
});


Meteor.publish('knownhooks', function(){
  if (Roles.userIsInRole(this.userId, ['admin'])) {
    return KnownHooks.find({}, {
      fields: {
        "alive": 1,
        "approved": 1,
        "hook_id": 1,
        "repoFullName": 1,
        "lastSeen": 1,
        "lastTested": 1,
      }
    });
  }
});


Meteor.publish('log', function(logId){
  return AutoPublish.find(logId);
});
