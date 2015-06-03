'use strict';

Template.repoWebhook.onRendered(function(){
  var self = this;
  if (self.data.repoDetails && self.data.repoDetails.enabled){
    self.$('.ui.checkbox')
      .checkbox('check')
    ;
  }
  else {
    self.$('.ui.checkbox')
      .checkbox('uncheck')
    ;
  }
});

Template.repoWebhook.created = function(){
  var self = this;
  self.updating = new ReactiveVar(false);
};

Template.repoWebhook.helpers({
  updating: function(){
    return Template.instance().updating.get();
  },
});

Template.repoWebhook.events({
  'click .ui.checkbox': function(e, instance){
    instance.updating.set(true);
    Meteor.call('toggleWebhook', {
      id: instance.data._id,
      fullName: instance.data.full_name,
      gitUrl: instance.data.html_url
    }, function(err, result){
      instance.updating.set(false);
      if (result.enabled !== undefined){
        instance.data.repoDetails.enabled = result.enabled;
        var status = 'uncheck';
        if (result.enabled){
          status = 'check';
        }
        instance.$('.ui.checkbox').checkbox(status);
      }
    });
  },
});
