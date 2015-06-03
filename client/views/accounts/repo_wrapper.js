'use strict';

Template.repoWrapper.onRendered(function(){
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

Template.repoWrapper.created = function(){
  var self = this;
  self.updating = new ReactiveVar(false);
};

Template.repoWrapper.helpers({
  updating: function(){
    return Template.instance().updating.get();
  },
});

Template.repoWrapper.events({
  'click .ui.checkbox': function(e, instance){
    instance.updating.set(true);
    Meteor.call('toggleWrapper', {
      id: instance.data._id,
      fullName: instance.data.full_name,
      gitUrl: instance.data.html_url
    }, function(err, result){
      instance.updating.set(false);
      if (result.enabled !== undefined){
        instance.data.enabled = result.enabled;
        var status = 'uncheck';
        if (result.enabled){
          status = 'check';
        }
        instance.$('.ui.checkbox').checkbox(status);
      }
    });
  },
});
