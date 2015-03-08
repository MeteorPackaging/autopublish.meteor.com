/* global
    moment: false
*/
'use strict';


Template.hookItem.rendered = function() {
  var
    self = this,
    status = 'uncheck';

  if (self.data.approved) {
    status = 'check';
  }

  self.$('.ui.checkbox').checkbox(status);
};

Template.hookItem.created = function() {
  var self = this;
  self.updating = new ReactiveVar(false);
};

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

    Meteor.call('toggleApproveHook',
      this.hook_id,
      this.repoFullName,
      function(err, result) {
        instance.updating.set(false);
        if (result.approved !== undefined) {
          var status = 'uncheck';
          if (result.approved) {
            status = 'check';
          }
          instance.$('.ui.checkbox').checkbox(status);
        }
      }
    );
  },
  'click #removeHook': function(e){
    e.preventDefault();

    Meteor.call('removeHook',
      this.hook_id,
      this.repoFullName
    );
  },
  'click #testHook': function(e){
    e.preventDefault();

    console.log("Test hook " + this.hook_id);
    Meteor.call('testHook',
      this.hook_id,
      this.repoFullName
    );
  },
});
