/* global
    moment: false
*/
'use strict';


Template.hookItem.onRendered(function() {
  var
    self = this,
    status = 'uncheck';

  if (self.data.approved) {
    status = 'check';
  }

  self.$('.ui.checkbox').checkbox(status);
});


Template.hookItem.onCreated(function() {
  var self = this;
  self.updating = new ReactiveVar(false);
});


Template.hookItem.helpers({
  updating: function() {
    return Template.instance().updating.get();
  },
  lastSeen: function(){
      // Trick to make this recomputing every minute...
      Router.current().state.get('counter');
      if (this.lastSeen) {
        return moment(this.lastSeen).fromNow();
      }
      else {
        return 'Never!';
      }
    },
  lastTested: function(){
      // Trick to make this recomputing every minute...
      Router.current().state.get('counter');
      if (this.lastTested) {
        return moment(this.lastTested).fromNow();
      }
      else {
        return 'Never!';
      }
    },
});


Template.hookItem.events({
  'click .ui.checkbox': function(e, instance) {
    e.preventDefault();
    instance.updating.set(true);

    var newStatus = $(e.currentTarget).checkbox('is checked');
    Meteor.call('toggleApproveHook',
      this.hook_id,
      this.repoFullName,
      function(err, result) {
        instance.updating.set(false);
        if (!err && !!result && 'approved' in result){
          newStatus = result.approved;
          instance.data.approved = newStatus;
        }
        else {
          newStatus = !newStatus;
        }
        var status = 'uncheck';
        if (newStatus){
          status = 'check';
        }
        instance.$('.ui.checkbox').checkbox(newStatus);
      }
    );
  },
  'click #removeHook': function(e){
    e.preventDefault();
    Meteor.call('removeHook', this.repoFullName);
  },
  'click #testHook': function(e){
    e.preventDefault();

    Meteor.call('testHook',
      this.hook_id,
      this.repoFullName
    );
  },
});
