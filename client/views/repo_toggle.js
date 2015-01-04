'use strict';

Template.repoToggle.rendered = function(){
  if (this.data.info && this.data.info.enabled){
    this.$('.ui.checkbox')
      .checkbox('check')
    ;
  }
  else {
    this.$('.ui.checkbox')
      .checkbox('uncheck')
    ;
  }
};

Template.repoToggle.created = function(){
  var self = this;
  self.updating = new ReactiveVar(false);
};

Template.repoToggle.helpers({
  updating: function(){
    return Template.instance().updating.get();
  },
});

Template.repoToggle.events({
  'click .ui.checkbox': function(e, instance){
    console.log("toggling web hook for: " + instance.data.full_name);
    instance.updating.set(true);
    Meteor.call('toggleRepo', {
      id: instance.data._id,
      fullName: instance.data.full_name,
      pkgName: instance.data.info.name,
      pkgVersion: instance.data.info.version,
      pkgSummary: instance.data.info.summary,
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
