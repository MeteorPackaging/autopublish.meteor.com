/* global
    moment: false
*/
'use strict';


Template.subscriptionItem.onRendered(function() {
  var
    self = this,
    status = 'uncheck';

  if (self.data.approved) {
    status = 'check';
  }

  self.$('.ui.checkbox').checkbox(status);
});


Template.subscriptionItem.onCreated(function() {
  var self = this;
  self.updating = new ReactiveVar(false);
});


Template.subscriptionItem.helpers({
  updating: function() {
    return Template.instance().updating.get();
  },
  approvalDate: function(){
    // Trick to make this recomputing every minute...
    Router.current().state.get('counter');
    if (this.approvedAt) {
      return moment(this.approvedAt).fromNow();
    }
    else {
      return 'Never!';
    }
  },
});


Template.subscriptionItem.events({
  'click .ui.checkbox': function(e, instance) {
    e.preventDefault();
    instance.updating.set(true);

    var repoInfo = {
      fullName: this.user + '/' + this.repo,
      id: this.repoId,
    };
    var newStatus = $(e.currentTarget).checkbox('is checked');
    Meteor.call('toggleApproveSubscription', repoInfo, function(err, result) {
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
    });
  },
  'click #removeSubscription': function(e){
    e.preventDefault();
    var repoInfo = {
      fullName: this.user + '/' + this.repo,
      id: this.repoId,
    };
    Meteor.call('removeSubscription', repoInfo);
  },
});
